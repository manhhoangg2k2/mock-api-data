import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { IconHelpCircle } from "@/components/ui/icons";
import {
  DEFAULT_CUSTOM_TEMPLATE_JSON,
  FALLBACK_HINTS,
  FALLBACK_TEMPLATE_PRESETS,
  type SchemaHints,
} from "./constants";
import { EndpointFormSections } from "./EndpointFormSections";
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
import { EndpointBuilderTour, hasCompletedTour } from "./tour/EndpointBuilderTour";

type PreviewResponse = { body: unknown; chaos: { path: string; kind: string }[] };

type Props = {
  projectId: string;
  onCreated: () => void;
  onError: (msg: string | null) => void;
};

export function EndpointCreatePanel({ projectId, onCreated, onError }: Props) {
  const [hints, setHints] = useState<SchemaHints>(FALLBACK_HINTS);
  const [tourOpen, setTourOpen] = useState(false);
  const [pathInputFocused, setPathInputFocused] = useState(false);

  const [responsePreset, setResponsePreset] = useState<ResponsePresetId>("single_object");
  const [path, setPath] = useState("v1/items");
  const [methods, setMethods] = useState<Set<string>>(new Set(["GET", "OPTIONS"]));
  const [responseShape, setResponseShape] = useState<"object" | "array">("object");
  const [fields, setFields] = useState<FieldFormRow[]>(() => defaultEndpointFields());
  const [paginationEnabled, setPaginationEnabled] = useState(false);
  const [paginationTotal, setPaginationTotal] = useState(1_000_000);
  const [pageSizeDefault, setPageSizeDefault] = useState(20);
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

  const [previewLimit, setPreviewLimit] = useState(10);
  const [previewStressChaos, setPreviewStressChaos] = useState(false);
  const [previewBody, setPreviewBody] = useState<unknown>(null);
  const [previewChaos, setPreviewChaos] = useState<{ path: string; kind: string }[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [previewRolls, setPreviewRolls] = useState<PreviewResponse[] | null>(null);

  useEffect(() => {
    if (!hasCompletedTour()) {
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
          previewStressChaos: previewStressChaos || undefined,
        },
      });
      setPreviewBody(res.body);
      setPreviewChaos(res.chaos ?? []);
    } catch (e) {
      if (e instanceof ApiError) {
        const msg = String((e.body as { message?: string })?.message ?? e.message);
        setPreviewErr(msg);
      } else setPreviewErr(String(e));
      setPreviewBody(null);
      setPreviewChaos([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [
    path,
    methods,
    fields,
    schemaConfig,
    paginationEnabled,
    previewLimit,
    previewStressChaos,
    templateForm,
  ]);

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
      return;
    }
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
        previewStressChaos: previewStressChaos || undefined,
      };
      const rolls = await Promise.all(
        Array.from({ length: n }, () =>
          apiFetch<PreviewResponse>("/v1/preview", { method: "POST", json: payload })
        )
      );
      setPreviewRolls(rolls);
    } catch (e) {
      if (e instanceof ApiError) {
        setPreviewErr(String((e.body as { message?: string })?.message ?? e.message));
      } else setPreviewErr(String(e));
      setPreviewRolls(null);
    } finally {
      setPreviewLoading(false);
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
      onError(v);
      return;
    }
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
      setPreviewStressChaos(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        onError(String((err.body as { message?: string })?.message ?? err.message));
      } else onError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <EndpointBuilderTour open={tourOpen} onClose={() => setTourOpen(false)} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
        <form
          onSubmit={onSubmit}
          className="space-y-8 rounded-2xl border border-surface-border/60 bg-surface-raised/30 p-6 sm:p-8"
        >
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-surface-border/40 pb-6">
            <div>
              <h2 className="text-lg font-medium tracking-tight text-slate-100">Tạo endpoint</h2>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Form gọn; chi tiết nằm sau icon{" "}
                <IconHelpCircle size={12} className="inline text-slate-500" />.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-border/80 bg-surface/50 px-3 py-2 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-200"
            >
              <IconHelpCircle size={14} />
              Hướng dẫn
            </button>
          </header>

          <EndpointFormSections
            path={path}
            setPath={setPath}
            pathInputFocused={pathInputFocused}
            setPathInputFocused={setPathInputFocused}
            methods={methods}
            toggleMethod={toggleMethod}
            responsePreset={responsePreset}
            setPreset={setPreset}
            responseShape={responseShape}
            paginationEnabled={paginationEnabled}
            arrayItemCount={arrayItemCount}
            setArrayItemCount={setArrayItemCount}
            pageSizeDefault={pageSizeDefault}
            setPageSizeDefault={setPageSizeDefault}
            paginationTotal={paginationTotal}
            setPaginationTotal={setPaginationTotal}
            goCustomShape={goCustomShape}
            goCustomPagination={goCustomPagination}
            locales={locales}
            dataLocale={dataLocale}
            setDataLocale={setDataLocale}
            templatePresets={templatePresets}
            responseTemplateId={responseTemplateId}
            setResponseTemplateId={setResponseTemplateId}
            responseTemplateResourceType={responseTemplateResourceType}
            setResponseTemplateResourceType={setResponseTemplateResourceType}
            responseTemplateCustomJson={responseTemplateCustomJson}
            setResponseTemplateCustomJson={setResponseTemplateCustomJson}
            fields={fields}
            updateField={updateField}
            removeField={removeField}
            addField={() => setFields((r) => [...r, newFieldRow()])}
            fakerHints={hints.fakerHints}
            edgePresets={hints.edgePresets}
            edgeCatalog={hints.edgeCatalog}
            latencyMin={latencyMin}
            setLatencyMin={setLatencyMin}
            latencyMax={latencyMax}
            setLatencyMax={setLatencyMax}
            rouletteEnabled={rouletteEnabled}
            setRouletteEnabled={setRouletteEnabled}
            rouletteRows={rouletteRows}
            setRouletteRows={setRouletteRows}
            schemaJsonPretty={schemaJsonPretty}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-surface hover:bg-sky-300 disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {submitting ? "Đang lưu…" : "Lưu endpoint"}
          </button>
        </form>

        <PreviewAside
          paginationEnabled={paginationEnabled}
          responseShape={responseShape}
          arrayItemCount={arrayItemCount}
          previewLimit={previewLimit}
          setPreviewLimit={setPreviewLimit}
          previewStressChaos={previewStressChaos}
          setPreviewStressChaos={setPreviewStressChaos}
          previewLoading={previewLoading}
          previewErr={previewErr}
          previewBody={previewBody}
          previewChaos={previewChaos}
          previewRolls={previewRolls}
          onReroll={() => void runPreview()}
          onMultiRoll={(n) => void runMultiPreview(n)}
        />
      </div>
    </>
  );
}
