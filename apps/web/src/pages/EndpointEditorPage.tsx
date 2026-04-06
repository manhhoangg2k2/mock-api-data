import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { EndpointConfigForm } from "@/components/endpoint/EndpointConfigForm";
import { PreviewAside } from "@/components/endpoint/PreviewAside";
import { FieldError } from "@/components/ui/field-error";
import {
  DEFAULT_CUSTOM_TEMPLATE_JSON,
  FALLBACK_HINTS,
  FALLBACK_TEMPLATE_PRESETS,
  type SchemaHints,
} from "@/components/endpoint/constants";
import {
  applyResponsePreset,
  buildSchemaConfigFromForm,
  buildStatusRouletteMap,
  newFieldRow,
  newRouletteRow,
  schemaConfigToEditorForm,
  validateEndpointForm,
  type FieldFormRow,
  type ResponsePresetId,
  type ResponseTemplateIdStr,
  type StatusRouletteRow,
} from "@/components/endpoint/schema-form";

type PreviewResponse = { body: unknown; chaos: { path: string; kind: string }[] };

const EDITOR_FORM_ID = "endpoint-editor-form";

type EndpointRow = {
  id: string;
  projectId: string;
  pathNormalized: string;
  methodsAllowed: string[];
  schemaConfig: unknown;
  latencyMsMin: number | null;
  latencyMsMax: number | null;
  statusRoulette: Record<string, number> | null;
  createdAt: string;
};

function parseStatusRoulette(
  raw: Record<string, number> | null | undefined
): { enabled: boolean; rows: StatusRouletteRow[] } {
  if (!raw || typeof raw !== "object" || Object.keys(raw).length === 0) {
    return { enabled: false, rows: [newRouletteRow(200, 100)] };
  }
  const rows = Object.entries(raw)
    .map(([code, weight]) => ({
      clientId: crypto.randomUUID(),
      code: Number(code),
      weight: Math.max(0, Number(weight)),
    }))
    .filter((r) => r.weight > 0 && Number.isFinite(r.code));
  if (!rows.length) return { enabled: false, rows: [newRouletteRow(200, 100)] };
  return { enabled: true, rows };
}

export function EndpointEditorPage() {
  const { projectId, endpointId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingEndpoint, setLoadingEndpoint] = useState(true);
  const [hints, setHints] = useState<SchemaHints>(FALLBACK_HINTS);
  const [pathInputFocused, setPathInputFocused] = useState(false);
  const [aiDraft, setAiDraft] = useState("");

  const [responsePreset, setResponsePreset] = useState<ResponsePresetId>("single_object");
  const [path, setPath] = useState("v1/items");
  const [methods, setMethods] = useState<Set<string>>(new Set(["GET", "OPTIONS"]));
  const [responseShape, setResponseShape] = useState<"object" | "array">("object");
  const [fields, setFields] = useState<FieldFormRow[]>([]);
  const [paginationEnabled, setPaginationEnabled] = useState(false);
  const [paginationTotal, setPaginationTotal] = useState(1_000_000);
  const [pageSizeDefault, setPageSizeDefault] = useState(20);
  const [paginationDefaultPage, setPaginationDefaultPage] = useState(1);
  const [arrayItemCount, setArrayItemCount] = useState(5);
  const [dataLocale, setDataLocale] = useState("en");
  const [responseTemplateId, setResponseTemplateId] = useState<ResponseTemplateIdStr>("none");
  const [responseTemplateResourceType, setResponseTemplateResourceType] = useState("users");
  const [responseTemplateCustomJson, setResponseTemplateCustomJson] = useState(
    DEFAULT_CUSTOM_TEMPLATE_JSON
  );
  const [latencyMin, setLatencyMin] = useState(0);
  const [latencyMax, setLatencyMax] = useState(0);
  const [rouletteEnabled, setRouletteEnabled] = useState(false);
  const [rouletteRows, setRouletteRows] = useState<StatusRouletteRow[]>(() => [
    newRouletteRow(200, 100),
  ]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [previewLimit, setPreviewLimit] = useState(10);
  const [previewBody, setPreviewBody] = useState<unknown>(null);
  const [previewChaos, setPreviewChaos] = useState<{ path: string; kind: string }[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [previewRolls, setPreviewRolls] = useState<PreviewResponse[] | null>(null);
  const previewSeqRef = useRef(0);

  const slug = user?.publicSlug ?? "…";

  const apiOrigin =
    import.meta.env.VITE_API_ORIGIN ||
    (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:3000` : "");
  const publicSlug = user?.publicSlug ?? user?.username ?? "";
  const mockUrlPrefix =
    publicSlug.length > 0
      ? `${String(apiOrigin).replace(/\/+$/, "")}/api/${publicSlug}`
      : undefined;

  useEffect(() => {
    let cancelled = false;
    apiFetch<SchemaHints>("/v1/meta/schema-hints")
      .then((h) => {
        if (cancelled || !h?.fakerHints?.length || !h?.edgePresets?.length) return;
        setHints({
          fakerHints: h.fakerHints,
          edgePresets: h.edgePresets,
          dataLocales: h.dataLocales?.length ? h.dataLocales : FALLBACK_HINTS.dataLocales,
          edgeCatalog: h.edgeCatalog?.length ? h.edgeCatalog : undefined,
          responseTemplatePresets: h.responseTemplatePresets?.length
            ? h.responseTemplatePresets
            : FALLBACK_TEMPLATE_PRESETS,
        });
      })
      .catch(() => {
        /* fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!endpointId) {
      setLoadingEndpoint(false);
      setLoadErr("Thiếu endpointId.");
      return;
    }
    let cancelled = false;
    setLoadingEndpoint(true);
    setLoadErr(null);
    apiFetch<EndpointRow>(`/v1/endpoints/${endpointId}`)
      .then((row) => {
        if (cancelled) return;
        if (projectId && row.projectId !== projectId) {
          setLoadErr("Endpoint không thuộc project này.");
          return;
        }
        setPath(row.pathNormalized);
        setMethods(new Set(row.methodsAllowed.map((m) => String(m).toUpperCase())));
        const fromSchema = schemaConfigToEditorForm(row.schemaConfig);
        setResponsePreset(fromSchema.responsePreset);
        setResponseShape(fromSchema.responseShape);
        setFields(fromSchema.fields);
        setPaginationEnabled(fromSchema.paginationEnabled);
        setPaginationTotal(fromSchema.paginationTotal);
        setPageSizeDefault(fromSchema.pageSizeDefault);
        setPaginationDefaultPage(fromSchema.paginationDefaultPage);
        setArrayItemCount(fromSchema.arrayItemCount);
        setDataLocale(fromSchema.dataLocale);
        setResponseTemplateId(fromSchema.responseTemplateId);
        setResponseTemplateResourceType(fromSchema.responseTemplateResourceType);
        setResponseTemplateCustomJson(fromSchema.responseTemplateCustomJson);
        setLatencyMin(row.latencyMsMin ?? 0);
        setLatencyMax(Math.max(row.latencyMsMin ?? 0, row.latencyMsMax ?? 0));
        const r = parseStatusRoulette(row.statusRoulette ?? null);
        setRouletteEnabled(r.enabled);
        setRouletteRows(r.rows);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          navigate(projectId ? `/projects/${projectId}` : "/projects", { replace: true });
          return;
        }
        setLoadErr(e instanceof ApiError ? String(e.message) : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoadingEndpoint(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpointId, projectId, navigate]);

  useEffect(() => {
    const pag =
      responsePreset === "paginated" || (responsePreset === "custom" && paginationEnabled);
    if (!pag) return;
    const maxP = Math.max(
      1,
      Math.ceil(Math.max(1, paginationTotal) / Math.min(100, Math.max(1, pageSizeDefault)))
    );
    setPaginationDefaultPage((n) => Math.min(Math.max(1, n), maxP));
  }, [responsePreset, paginationEnabled, paginationTotal, pageSizeDefault]);

  const templateForm = useMemo(
    () => ({
      id: responseTemplateId,
      resourceType: responseTemplateResourceType,
      customJson: responseTemplateCustomJson,
    }),
    [responseTemplateId, responseTemplateResourceType, responseTemplateCustomJson]
  );

  const schemaConfig = useMemo(
    () =>
      buildSchemaConfigFromForm({
        responseShape,
        fields,
        paginationEnabled,
        paginationTotal,
        pageSizeDefault,
        paginationDefaultPage,
        arrayItemCount,
        dataLocale,
        responseTemplateId,
        responseTemplateResourceType,
        responseTemplateCustomJson,
      }),
    [
      responseShape,
      fields,
      paginationEnabled,
      paginationTotal,
      pageSizeDefault,
      paginationDefaultPage,
      arrayItemCount,
      dataLocale,
      responseTemplateId,
      responseTemplateResourceType,
      responseTemplateCustomJson,
    ]
  );

  const schemaJsonPretty = useMemo(() => JSON.stringify(schemaConfig, null, 2), [schemaConfig]);

  const locales = hints.dataLocales?.length ? hints.dataLocales : FALLBACK_HINTS.dataLocales!;
  const templatePresets =
    hints.responseTemplatePresets && hints.responseTemplatePresets.length > 0
      ? hints.responseTemplatePresets
      : FALLBACK_TEMPLATE_PRESETS;

  const runPreview = useCallback(async () => {
    const v = validateEndpointForm(path, methods, fields, templateForm);
    if (v) {
      setPreviewErr(v);
      setPreviewBody(null);
      setPreviewChaos([]);
      setPreviewRolls(null);
      return;
    }
    const seq = ++previewSeqRef.current;
    setPreviewLoading(true);
    setPreviewErr(null);
    setPreviewRolls(null);
    try {
      const q: Record<string, string> = {};
      if (paginationEnabled) {
        q.limit = String(Math.min(100, Math.max(1, previewLimit)));
        q.page = "1";
      }
      const res = await apiFetch<PreviewResponse>("/v1/preview", {
        method: "POST",
        json: {
          schemaConfig,
          query: paginationEnabled ? q : undefined,
        },
      });
      if (seq !== previewSeqRef.current) return;
      setPreviewBody(res.body);
      setPreviewChaos(res.chaos ?? []);
      setPreviewRolls(null);
    } catch (e) {
      if (seq !== previewSeqRef.current) return;
      if (e instanceof ApiError) {
        const msg = String((e.body as { message?: string })?.message ?? e.message);
        setPreviewErr(msg);
      } else setPreviewErr(String(e));
      setPreviewBody(null);
      setPreviewChaos([]);
      setPreviewRolls(null);
    } finally {
      if (seq === previewSeqRef.current) setPreviewLoading(false);
    }
  }, [path, methods, fields, schemaConfig, paginationEnabled, previewLimit, templateForm]);

  async function runMultiPreview(n: number) {
    const v = validateEndpointForm(path, methods, fields, templateForm);
    if (v) {
      setPreviewErr(v);
      setPreviewRolls(null);
      return;
    }
    const seq = ++previewSeqRef.current;
    setPreviewLoading(true);
    setPreviewErr(null);
    setPreviewBody(null);
    setPreviewChaos([]);
    try {
      const q: Record<string, string> = {};
      if (paginationEnabled) {
        q.limit = String(Math.min(100, Math.max(1, previewLimit)));
        q.page = "1";
      }
      const payload = { schemaConfig, query: paginationEnabled ? q : undefined };
      const rolls = await Promise.all(
        Array.from({ length: n }, () =>
          apiFetch<PreviewResponse>("/v1/preview", { method: "POST", json: payload })
        )
      );
      if (seq !== previewSeqRef.current) return;
      setPreviewRolls(rolls);
    } catch (e) {
      if (seq !== previewSeqRef.current) return;
      if (e instanceof ApiError) {
        setPreviewErr(String(mapApiError(e)));
      } else setPreviewErr(String(e));
      setPreviewRolls(null);
    } finally {
      if (seq === previewSeqRef.current) setPreviewLoading(false);
    }
  }

  function mapApiError(e: ApiError): string {
    return String((e.body as { message?: string })?.message ?? e.message);
  }

  useEffect(() => {
    if (loadingEndpoint || loadErr) return;
    const t = window.setTimeout(() => {
      void runPreview();
    }, 450);
    return () => window.clearTimeout(t);
  }, [loadingEndpoint, loadErr, runPreview]);

  useEffect(() => {
    setSaveErr(null);
  }, [path, methods, fields, responseTemplateId, responseTemplateResourceType, responseTemplateCustomJson]);

  function setPreset(id: ResponsePresetId) {
    setResponsePreset(id);
    applyResponsePreset(id, {
      setResponseShape,
      setPaginationEnabled,
    });
  }

  function goCustomPagination(next: boolean) {
    setResponsePreset("custom");
    setPaginationEnabled(next);
  }

  function goCustomShape(next: "object" | "array") {
    setResponsePreset("custom");
    setResponseShape(next);
  }

  function toggleMethod(m: string) {
    setMethods((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  function updateField(clientId: string, next: FieldFormRow) {
    setFields((rows) => rows.map((r) => (r.clientId === clientId ? next : r)));
  }

  function removeField(clientId: string) {
    setFields((rows) => rows.filter((r) => r.clientId !== clientId));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!endpointId) return;
    const v = validateEndpointForm(path, methods, fields, templateForm);
    if (v) {
      toast.error(v);
      return;
    }
    setSaving(true);
    try {
      const statusRoulette = buildStatusRouletteMap(rouletteEnabled, rouletteRows);
      await apiFetch(`/v1/endpoints/${endpointId}`, {
        method: "PATCH",
        json: {
          path: path.trim(),
          methodsAllowed: [...methods],
          schemaConfig,
          latencyMsMin: latencyMin,
          latencyMsMax: Math.max(latencyMin, latencyMax),
          statusRoulette,
        },
      });
      toast.success("Đã lưu endpoint.");
    } catch (err) {
      if (err instanceof ApiError) {
        const m = String((err.body as { message?: string })?.message ?? err.message);
        setSaveErr(m);
        toast.error(m);
      } else {
        const m = String(err);
        setSaveErr(m);
        toast.error(m);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!projectId) {
    return (
      <p className="text-sm text-zinc-500">
        Thiếu project. <Link to="/projects" className="text-violet-400 hover:underline">Về danh sách</Link>
      </p>
    );
  }

  if (loadingEndpoint) {
    return (
      <div className="space-y-4">
        <Link to={`/projects/${projectId}`} className="text-sm text-violet-400/90 hover:underline">
          ← Quay lại project
        </Link>
        <p className="text-sm text-zinc-500">Đang tải endpoint…</p>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="space-y-4">
        <Link to={`/projects/${projectId}`} className="text-sm text-violet-400/90 hover:underline">
          ← Quay lại project
        </Link>
        <FieldError message={loadErr} />
      </div>
    );
  }

  const formProps = {
    path,
    setPath,
    pathInputFocused,
    setPathInputFocused,
    methods,
    toggleMethod,
    responsePreset,
    setPreset,
    responseShape,
    paginationEnabled,
    arrayItemCount,
    setArrayItemCount,
    pageSizeDefault,
    setPageSizeDefault,
    paginationTotal,
    setPaginationTotal,
    paginationDefaultPage,
    setPaginationDefaultPage,
    goCustomShape,
    goCustomPagination,
    locales,
    dataLocale,
    setDataLocale,
    templatePresets,
    responseTemplateId,
    setResponseTemplateId,
    responseTemplateResourceType,
    setResponseTemplateResourceType,
    responseTemplateCustomJson,
    setResponseTemplateCustomJson,
    fields,
    updateField,
    removeField,
    addField: () => setFields((r) => [...r, newFieldRow()]),
    fakerHints: hints.fakerHints,
    edgePresets: hints.edgePresets,
    edgeCatalog: hints.edgeCatalog,
    latencyMin,
    setLatencyMin,
    latencyMax,
    setLatencyMax,
    rouletteEnabled,
    setRouletteEnabled,
    rouletteRows,
    setRouletteRows,
    schemaJsonPretty,
    mockUrlPrefix,
    formError: saveErr,
  };

  return (
    <div className="space-y-4">
      <div className="text-[11px] text-zinc-500">
        <Link to={`/projects/${projectId}`} className="text-violet-400/90 hover:underline">
          ← Project
        </Link>
        <span className="mx-2 text-zinc-700">·</span>
        <span className="font-mono text-zinc-400">
          /api/{slug}/{path || "…"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-stretch lg:gap-6">
        <div className="flex min-w-0 flex-col rounded-md border border-zinc-800 bg-zinc-950 lg:col-span-3">
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2.5 backdrop-blur-md">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-100">Cấu hình Endpoint</h2>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to={`/projects/${projectId}`}
                className="rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              >
                Hủy
              </Link>
              <button
                type="submit"
                form={EDITOR_FORM_ID}
                disabled={saving}
                className="rounded bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-900/30 hover:bg-violet-500 disabled:opacity-50"
              >
                {saving ? "Đang lưu…" : "Lưu endpoint"}
              </button>
            </div>
          </div>

          <div className="p-3">
            <form id={EDITOR_FORM_ID} onSubmit={onSave}>
              <details className="mb-4 rounded-md border border-zinc-800 bg-zinc-900/30">
                <summary className="cursor-pointer px-2 py-1.5 text-[10px] text-zinc-500 [&::-webkit-details-marker]:hidden">
                  AI gợi ý schema (mock)
                </summary>
                <div className="border-t border-zinc-800 p-2">
                  <textarea
                    value={aiDraft}
                    onChange={(e) => setAiDraft(e.target.value)}
                    rows={2}
                    className="w-full rounded border border-zinc-800 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => toast.info("Chưa kết nối model — UI mock.")}
                    className="mt-1 text-[10px] text-violet-400 hover:underline"
                  >
                    Gợi ý
                  </button>
                </div>
              </details>
              <EndpointConfigForm {...formProps} />
            </form>
          </div>
        </div>

        <div className="min-h-0 lg:col-span-2">
          <PreviewAside
            paginationEnabled={paginationEnabled}
            responseShape={responseShape}
            arrayItemCount={arrayItemCount}
            previewLimit={previewLimit}
            setPreviewLimit={setPreviewLimit}
            previewLoading={previewLoading}
            previewErr={previewErr}
            previewBody={previewBody}
            previewChaos={previewChaos}
            previewRolls={previewRolls}
            onReroll={() => void runPreview()}
            onMultiRoll={(n) => void runMultiPreview(n)}
          />
        </div>
      </div>
    </div>
  );
}
