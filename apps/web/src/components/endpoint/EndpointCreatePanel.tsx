import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, apiFetch } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { IconHelpCircle } from "@/components/ui/icons";
import {
  DEFAULT_CUSTOM_TEMPLATE_JSON,
  FALLBACK_HINTS,
  FALLBACK_TEMPLATE_PRESETS,
  type SchemaHints,
} from "./constants";
import { EndpointConfigForm } from "./EndpointConfigForm";
import { PreviewAside } from "./PreviewAside";
import {
  applyResponsePreset,
  buildSchemaConfigFromForm,
  buildStatusRouletteMap,
  defaultEndpointFields,
  newFieldRow,
  newRouletteRow,
  validateEndpointForm,
  type FieldFormRow,
  type ResponsePresetId,
  type ResponseTemplateIdStr,
  type StatusRouletteRow,
} from "./schema-form";
import { hasPendingEndpointTourAfterAuth } from "@/lib/endpoint-tour-session";
import { EndpointBuilderTour, hasCompletedTour } from "./tour/EndpointBuilderTour";

type PreviewResponse = { body: unknown; chaos: { path: string; kind: string }[] };

type Props = {
  projectId: string;
  mockUrlPrefix?: string;
  onCreated: () => void;
  onError: (msg: string | null) => void;
};

const FORM_ID = "endpoint-create-form";

export function EndpointCreatePanel({ projectId, mockUrlPrefix, onCreated, onError }: Props) {
  const toast = useToast();
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIdx, setTourStepIdx] = useState(0);
  const [pathInputFocused, setPathInputFocused] = useState(false);

  const [hints, setHints] = useState<SchemaHints>(FALLBACK_HINTS);
  const [responsePreset, setResponsePreset] = useState<ResponsePresetId>("single_object");
  const [path, setPath] = useState("v1/items");
  const [methods, setMethods] = useState<Set<string>>(new Set(["GET", "OPTIONS"]));
  const [responseShape, setResponseShape] = useState<"object" | "array">("object");
  const [fields, setFields] = useState<FieldFormRow[]>(() => defaultEndpointFields());
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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [previewLimit, setPreviewLimit] = useState(10);
  const [previewBody, setPreviewBody] = useState<unknown>(null);
  const [previewChaos, setPreviewChaos] = useState<{ path: string; kind: string }[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [previewRolls, setPreviewRolls] = useState<PreviewResponse[] | null>(null);
  const previewSeqRef = useRef(0);

  useEffect(() => {
    if (!hasCompletedTour() && hasPendingEndpointTourAfterAuth()) {
      const t = window.setTimeout(() => setTourOpen(true), 450);
      return () => window.clearTimeout(t);
    }
  }, []);

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
    setFormError(null);
  }, [path, methods, fields, responseTemplateId, responseTemplateResourceType, responseTemplateCustomJson]);

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

  useEffect(() => {
    const t = window.setTimeout(() => {
      void runPreview();
    }, 450);
    return () => window.clearTimeout(t);
  }, [runPreview]);

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
      const payload = {
        schemaConfig,
        query: paginationEnabled ? q : undefined,
      };
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
        setPreviewErr(String((e.body as { message?: string })?.message ?? e.message));
      } else setPreviewErr(String(e));
      setPreviewRolls(null);
    } finally {
      if (seq === previewSeqRef.current) setPreviewLoading(false);
    }
  }

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validateEndpointForm(path, methods, fields, templateForm);
    if (v) {
      setFormError(v);
      return;
    }
    setFormError(null);
    onError(null);
    setSubmitting(true);
    try {
      const statusRoulette = buildStatusRouletteMap(rouletteEnabled, rouletteRows);
      await apiFetch(`/v1/projects/${projectId}/endpoints`, {
        method: "POST",
        json: {
          path: path.trim(),
          methodsAllowed: [...methods],
          schemaConfig,
          latencyMsMin: latencyMin,
          latencyMsMax: Math.max(latencyMin, latencyMax),
          statusRoulette,
        },
      });
      setPath("v1/items");
      setMethods(new Set(["GET", "OPTIONS"]));
      setResponsePreset("single_object");
      setResponseShape("object");
      setFields(defaultEndpointFields());
      setPaginationEnabled(false);
      setPaginationTotal(1_000_000);
      setPageSizeDefault(20);
      setPaginationDefaultPage(1);
      setArrayItemCount(5);
      setDataLocale("en");
      setResponseTemplateId("none");
      setResponseTemplateResourceType("users");
      setResponseTemplateCustomJson(DEFAULT_CUSTOM_TEMPLATE_JSON);
      setLatencyMin(0);
      setLatencyMax(0);
      setRouletteEnabled(false);
      setRouletteRows([newRouletteRow(200, 100)]);
      setPreviewLimit(10);
      setFormError(null);
      toast.success("Đã tạo endpoint.");
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        const m = String((err.body as { message?: string })?.message ?? err.message);
        setFormError(m);
        onError(null);
        toast.error(m);
      } else {
        const m = String(err);
        setFormError(m);
        onError(null);
        toast.error(m);
      }
    } finally {
      setSubmitting(false);
    }
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
    tourStep: tourOpen ? tourStepIdx : null,
    mockUrlPrefix,
    formError,
  };

  return (
    <>
      <EndpointBuilderTour
        open={tourOpen}
        onClose={() => {
          setTourOpen(false);
          setTourStepIdx(0);
        }}
        onStepChange={setTourStepIdx}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-stretch lg:gap-6">
        <div className="flex min-w-0 flex-col rounded-md border border-zinc-800 bg-zinc-950 lg:col-span-3">
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2.5 backdrop-blur-md">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold tracking-tight text-zinc-100">
                Cấu hình Endpoint
              </h2>
              <button
                type="button"
                onClick={() => setTourOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-violet-500/65 bg-gradient-to-br from-violet-950/85 to-zinc-900 px-3 py-2 text-base font-semibold text-violet-100 shadow-md shadow-violet-950/40 ring-1 ring-violet-400/25 transition hover:border-violet-400 hover:from-violet-900/90 hover:text-white"
                title="Hướng dẫn từng bước — path, body, preview, mô phỏng lỗi…"
              >
                <IconHelpCircle size={16} className="text-violet-300" aria-hidden />
                Hướng dẫn
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to={`/projects/${projectId}`}
                className="rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-base font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              >
                Hủy
              </Link>
              <button
                type="submit"
                form={FORM_ID}
                disabled={submitting}
                className="rounded bg-violet-600 px-3 py-1.5 text-base font-semibold text-white shadow-sm shadow-violet-900/30 hover:bg-violet-500 disabled:opacity-50"
              >
                {submitting ? "Đang lưu…" : "Lưu endpoint"}
              </button>
            </div>
          </div>

          <div className="p-3">
            <form id={FORM_ID} onSubmit={onSubmit} className="pb-8">
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
    </>
  );
}
