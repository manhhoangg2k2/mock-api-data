import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Plus, RefreshCw, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { SchemaHints } from "@/components/endpoint/constants";
import { FALLBACK_HINTS } from "@/components/endpoint/constants";
import {
  FIELD_TYPES,
  FAKER_LABELS_VI,
  TYPE_LABELS_VI,
  RESPONSE_PRESETS,
  buildSchemaConfigFromForm,
  defaultEndpointFields,
  validateEndpointForm,
  newFieldRow,
  type FieldFormRow,
  type ResponsePresetId,
  type ResponseTemplateIdStr,
} from "@/components/endpoint/schema-form";
import { dm } from "@/lib/ui/dm-ui";
import { useToast } from "@/context/ToastContext";
import { InlineLegendLabel } from "@/components/ui/InlineLegendLabel";
import { FieldError } from "@/components/ui/field-error";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { StepperInput } from "@/components/ui/StepperInput";
import { Switch } from "@/components/ui/Switch";
import { LoadingSpinner } from "@/components/ui/AppLoadingScreen";

type ChaosCaseId = 1 | 2;

const GUEST_MAX_FIELDS = 10;
const GUEST_MAX_ITEMS = 10;
const GUEST_MAX_ENDPOINTS_PER_HOUR = 5;

const CHAOS_CASES: { id: ChaosCaseId; label: string; hint: string }[] = [
  { id: 1, label: "Thiếu trường", hint: "Bỏ key khỏi JSON để test optional / missing." },
  { id: 2, label: "Giá trị null", hint: "Gán null để test validation / null-safety." },
];

function applyGuestChaosCaseToField(row: FieldFormRow, chaosCase: ChaosCaseId): FieldFormRow {
  if (chaosCase === 1) {
    return { ...row, omitPercent: 60, nullPercent: 0, edgePercent: 0 };
  }
  if (chaosCase === 2) {
    return { ...row, omitPercent: 0, nullPercent: 60, edgePercent: 0 };
  }
  return row;
}

function pickChaosFieldId(fields: FieldFormRow[]): string | null {
  const emailField = fields.find((f) => f.key.trim().toLowerCase() === "email" || f.type === "email");
  if (emailField) return emailField.clientId;
  return fields.length ? fields[fields.length - 1]!.clientId : null;
}

function applyGuestChaosCaseToFields(
  fields: FieldFormRow[],
  chaosEnabled: boolean,
  chaosCase: ChaosCaseId
): FieldFormRow[] {
  if (!chaosEnabled) {
    return fields.map((f) => ({ ...f, omitPercent: 0, nullPercent: 0, edgePercent: 0 }));
  }

  const chaosId = pickChaosFieldId(fields);
  return fields.map((f) => {
    if (!chaosId || f.clientId !== chaosId) {
      return { ...f, omitPercent: 0, nullPercent: 0, edgePercent: 0 };
    }
    return applyGuestChaosCaseToField(f, chaosCase);
  });
}

function seededRand(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function seededUuid(seed: number) {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 32; i++) s += hex[Math.floor(seededRand(seed + i) * 16)];
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

function maybeEdgeValue(edgePreset: string, seed: number): unknown {
  switch (edgePreset) {
    case "email_bad":
      return seededRand(seed) < 0.5 ? "" : "not-an-email";
    case "negative_money":
      return -Math.floor(seededRand(seed) * 10_000) - 1;
    case "string_whitespace":
      return seededRand(seed) < 0.5 ? "   " : "\n\t\r";
    case "string_injection_like":
      return seededRand(seed) < 0.5 ? "' OR '1'='1" : "'; DROP TABLE users--";
    case "string_html_snippet":
      return "<script>alert(1)</script>";
    case "oversize_string":
      return "A".repeat(120);
    case "unicode_mixed":
      return "你好 مرحبا 😊";
    default:
      return "edge";
  }
}

function happyValueForType(type: FieldFormRow["type"], seed: number): unknown {
  switch (type) {
    case "uuid":
      return seededUuid(seed);
    case "email":
      return `user${seed}@example.com`;
    case "number":
    case "integer":
      return 1000 + Math.floor(seededRand(seed) * 1000);
    case "boolean":
      return seededRand(seed) > 0.5;
    case "url":
      return `https://example.com/u/${seed}`;
    case "date":
      return "2026-04-02";
    case "datetime":
      return "2026-04-02T10:00:00Z";
    case "time":
      return "10:00:00";
    case "ipv4":
      return `192.168.0.${Math.floor(seededRand(seed) * 255)}`;
    case "color":
      return "#38bdf8";
    case "array":
      return [`item_${Math.floor(seededRand(seed) * 100)}`, `item_${Math.floor(seededRand(seed + 1) * 100)}`];
    case "object":
      return {
        id: `obj_${Math.floor(seededRand(seed) * 1000)}`,
        ok: seededRand(seed + 1) > 0.5,
      };
    case "paragraph":
      return "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    case "slug":
      return `item-${Math.floor(seededRand(seed) * 900 + 100)}`;
    default:
      return `str_${seed}`;
  }
}

function happyValueForFaker(faker: string, seed: number): unknown | undefined {
  switch (faker) {
    case "uuid":
      return seededUuid(seed);
    case "fullName": {
      const names = ["Nguyen An", "Tran Binh", "Le Chi", "Pham Dung", "Alex Rivera"];
      return names[Math.floor(seededRand(seed) * names.length)] ?? names[0];
    }
    case "email":
      return `user${Math.floor(seededRand(seed) * 9999)}@example.com`;
    case "financeAmount":
      return Number((seededRand(seed) * 10000).toFixed(2));
    case "phone":
      return `09${Math.floor(seededRand(seed) * 90000000 + 10000000)}`;
    case "country": {
      const countries = ["Viet Nam", "Singapore", "Japan", "United States"];
      return countries[Math.floor(seededRand(seed) * countries.length)] ?? countries[0];
    }
    case "city": {
      const cities = ["Ha Noi", "Ho Chi Minh", "Da Nang", "Can Tho"];
      return cities[Math.floor(seededRand(seed) * cities.length)] ?? cities[0];
    }
    case "boolean":
      return seededRand(seed) > 0.5;
    default:
      return undefined;
  }
}

function generateRecordPreview(fields: FieldFormRow[], seed: number, forceChaos = false) {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]!;
    if (!f.key.trim()) continue;

    const omit = forceChaos && f.omitPercent > 0;
    const nul = forceChaos && f.nullPercent > 0;
    const edge = forceChaos && f.edgePercent > 0;

    if (omit) continue;
    if (nul) {
      out[f.key] = null;
      continue;
    }
    if (edge) {
      out[f.key] = maybeEdgeValue(f.edgePreset, seed + i * 17);
      continue;
    }

    const byFaker = f.faker ? happyValueForFaker(f.faker, seed + i * 17) : undefined;
    out[f.key] = byFaker !== undefined ? byFaker : happyValueForType(f.type, seed + i * 17);
  }
  return out;
}

function highlightChaosLine(line: string, chaosCase: ChaosCaseId, chaosFieldKey: string | null): boolean {
  if (!chaosFieldKey) return false;
  if (!line.includes(`"${chaosFieldKey}"`)) return false;

  if (chaosCase === 2) return line.includes(": null");
  return false;
}

function JsonPreview({ value, chaosCase, chaosFieldKey }: { value: unknown; chaosCase: ChaosCaseId; chaosFieldKey: string | null }) {
  const raw = JSON.stringify(value, null, 2);
  const lines = raw.split("\n");
  return (
    <pre className="m-0 overflow-x-auto p-4 font-mono text-base leading-relaxed text-zinc-300">
      <code>
        {lines.map((line, i) => {
          const bad = highlightChaosLine(line, chaosCase, chaosFieldKey);
          return (
            <span key={i} className={bad ? "block rounded px-2 -mx-2 bg-rose-950/50 text-rose-200" : "block"}>
              {line}
              {i < lines.length - 1 ? "\n" : ""}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

export function GuestGenerator() {
  const toast = useToast();
  const [hints, setHints] = useState<SchemaHints>(FALLBACK_HINTS);
  const [loadingHints, setLoadingHints] = useState(true);

  const [resourcePath, setResourcePath] = useState("v1/users");
  const [responsePreset, setResponsePreset] = useState<ResponsePresetId>("single_object");
  const [quantity, setQuantity] = useState(3);

  const [chaosCase, setChaosCase] = useState<ChaosCaseId>(2);

  const [chaosEnabled, setChaosEnabled] = useState(false);

  const [fields, setFields] = useState<FieldFormRow[]>(() =>
    applyGuestChaosCaseToFields(defaultEndpointFields(), false, 2)
  );

  const [rerollSeed, setRerollSeed] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimerRef = useRef<number | null>(null);

  const methods = useMemo(() => new Set<string>(["GET"]), []);

  const previewValue = useMemo(() => {
    const q = Math.min(GUEST_MAX_ITEMS, Math.max(1, Math.floor(quantity || 1)));
    const seed = 1000 + rerollSeed;
    const count = responsePreset === "single_object" ? 1 : q;
    const chaosIndex = chaosEnabled ? Math.min(count - 1, Math.floor(seededRand(seed + 7) * count)) : -1;

    if (responsePreset === "single_object") {
      return generateRecordPreview(fields, seed, chaosEnabled);
    }

    if (responsePreset === "array_list") {
      return Array.from({ length: count }, (_, i) =>
        generateRecordPreview(fields, seed + i * 101, i === chaosIndex)
      );
    }

    const items = Array.from({ length: count }, (_, i) =>
      generateRecordPreview(fields, seed + i * 101, i === chaosIndex)
    );
    return {
      data: items,
      meta: { page: 1, limit: q, total: 1_000_000 },
    };
  }, [fields, chaosEnabled, quantity, responsePreset, rerollSeed]);

  useEffect(() => {
    setPreviewLoading(true);
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = window.setTimeout(() => {
      setPreviewLoading(false);
      previewTimerRef.current = null;
    }, 260);
    return () => {
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    };
  }, [fields, quantity, responsePreset, rerollSeed, chaosEnabled, chaosCase]);

  const chaosFieldId = chaosEnabled ? pickChaosFieldId(fields) : null;
  const chaosFieldKey = chaosFieldId
    ? fields.find((f) => f.clientId === chaosFieldId)?.key.trim() ?? null
    : null;

  useEffect(() => {
    let cancelled = false;
    setLoadingHints(true);
    apiFetch<SchemaHints>("/v1/meta/schema-hints")
      .then((h) => {
        if (cancelled) return;
        setHints(h ?? FALLBACK_HINTS);
      })
      .catch(() => {
        if (cancelled) return;
        setHints(FALLBACK_HINTS);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingHints(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setFields((prev) => applyGuestChaosCaseToFields(prev, chaosEnabled, chaosCase));
    setRerollSeed(0);
  }, [chaosCase, chaosEnabled]);

  const canAddField = fields.length < GUEST_MAX_FIELDS;

  const addField = () => {
    if (!canAddField) return;
    const next = newFieldRow();
    setFields((prev) => applyGuestChaosCaseToFields([...prev, next], chaosEnabled, chaosCase));
  };

  const removeField = (clientId: string) => {
    setFields((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((f) => f.clientId !== clientId);
      return applyGuestChaosCaseToFields(next, chaosEnabled, chaosCase);
    });
  };

  const updateField = (clientId: string, patch: Partial<FieldFormRow>) => {
    setFields((prev) => {
      const next = prev.map((f) => (f.clientId === clientId ? { ...f, ...patch } : f));
      return applyGuestChaosCaseToFields(next, chaosEnabled, chaosCase);
    });
  };

  const showQuantity = responsePreset === "array_list" || responsePreset === "paginated";

  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseErr, setReleaseErr] = useState<string | null>(null);
  const [releasedUrl, setReleasedUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);

  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [quotaMax, setQuotaMax] = useState<number>(GUEST_MAX_ENDPOINTS_PER_HOUR);

  async function refreshQuota() {
    try {
      const q = await apiFetch<{ remaining: number; max: number }>("/v1/guest/quota", { method: "GET" });
      setQuotaRemaining(Number(q.remaining ?? 0));
      setQuotaMax(Number(q.max ?? GUEST_MAX_ENDPOINTS_PER_HOUR));
    } catch {
      /* quota optional */
    }
  }

  useEffect(() => {
    let cancelled = false;
    setQuotaLoading(true);
    void refreshQuota().finally(() => {
      if (cancelled) return;
      setQuotaLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function release() {
    setReleaseErr(null);
    setReleasedUrl(null);
    setExpiresAt(null);
    setReleaseLoading(true);
    try {
      const q = Math.min(GUEST_MAX_ITEMS, Math.max(1, Math.floor(quantity || 1)));

      if (fields.length > GUEST_MAX_FIELDS) {
        const m = `Guest tối đa ${GUEST_MAX_FIELDS} fields.`;
        setReleaseErr(m);
        toast.warning(m);
        setReleaseLoading(false);
        return;
      }

      const schemaConfig = buildSchemaConfigFromForm({
        responseShape: responsePreset === "array_list" ? "array" : "object",
        fields,
        paginationEnabled: responsePreset === "paginated",
        paginationTotal: 1_000_000,
        pageSizeDefault: responsePreset === "paginated" ? q : 10,
        paginationDefaultPage: 1,
        arrayItemCount: responsePreset === "array_list" ? q : 10,
        dataLocale: "en",
        responseTemplateId: "none" satisfies ResponseTemplateIdStr,
        responseTemplateResourceType: "",
        responseTemplateCustomJson: "{}",
      });

      const validation = validateEndpointForm(resourcePath, methods, fields, undefined);
      if (validation) {
        setReleaseErr(validation);
        toast.warning(validation);
        setReleaseLoading(false);
        return;
      }

      const res = await apiFetch<{ url: string; expiresAt: string }>("/v1/guest/endpoints", {
        method: "POST",
        json: {
          path: resourcePath,
          methodsAllowed: [...methods],
          schemaConfig,
          latencyMsMin: null,
          latencyMsMax: null,
          statusRoulette: null,
        },
      });

      setReleasedUrl(res.url);
      setExpiresAt(res.expiresAt);
      setReleaseDialogOpen(true);
      toast.success("Đã tạo Guest API. URL có trong hộp thoại và phần preview bên dưới.");
      void refreshQuota();
    } catch (e) {
      if (e instanceof ApiError) {
        const msg = e.body && typeof e.body === "object" && "message" in e.body ? String((e.body as any).message) : null;
        const m = msg ?? e.message;
        setReleaseErr(m);
        toast.error(m);
      } else {
        const m = String(e);
        setReleaseErr(m);
        toast.error(m);
      }
    } finally {
      setReleaseLoading(false);
    }
  }

  return (
    <div className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="pt-16 text-center sm:pt-20 md:pt-24">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            Mô phỏng lỗi thực tế. Tạo API Mock công khai ngay lập tức.
          </h2>
          <div
            role="status"
            className="mx-auto mt-6 max-w-2xl rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-left text-base text-amber-100/85"
          >
            <span className="text-base font-semibold uppercase tracking-wide text-amber-200/95">⚠️ Guest API</span>
            <p className="mt-1 leading-snug text-amber-100/75">
              API guest <strong className="text-amber-100">tồn tại ~30 phút</strong> và có giới hạn:{" "}
              <strong className="text-amber-100">tối đa 10 fields</strong> và <strong className="text-amber-100">tối đa 10 records</strong>.
              Mô phỏng lỗi chỉ cho phép <strong className="text-amber-100">1 kiểu</strong>.
            </p>
          </div>
        </header>

        <div className="mt-10 space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-4 sm:p-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
            <div className="flex flex-col gap-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 sm:p-6 lg:basis-3/5">
              <h3 className="text-base font-semibold uppercase tracking-wider text-zinc-400">Cấu hình Guest</h3>

              <div>
                <label className="text-base font-medium text-zinc-200" htmlFor="guest-path">
                  Resource path
                </label>
                <input
                  id="guest-path"
                  value={resourcePath}
                  onChange={(e) => setResourcePath(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-mono text-base text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                  placeholder="v1/users"
                />
                <p className="mt-1.5 text-base text-zinc-500">
                  Mock endpoint: <span className="font-mono text-zinc-400">/api/guest/&lt;token&gt;/{resourcePath}</span>
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-base font-medium text-zinc-400">Loại response</span>
                  <NativeSelect
                    value={responsePreset}
                    onChange={(e) => setResponsePreset(e.target.value as ResponsePresetId)}
                    ui="zinc"
                  >
                    {RESPONSE_PRESETS.filter((p) => p.id !== "custom").map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </NativeSelect>
                  <span className="block text-base text-zinc-500">{RESPONSE_PRESETS.find((p) => p.id === responsePreset)?.description}</span>
                </label>

                <label className="space-y-1">
                  <span className="block text-base font-medium text-zinc-400">Số lượng (tối đa {GUEST_MAX_ITEMS})</span>
                  <StepperInput
                    ariaLabel="Số lượng bản ghi guest"
                    min={1}
                    max={GUEST_MAX_ITEMS}
                    step={1}
                    disabled={!showQuantity}
                    value={showQuantity ? quantity : GUEST_MAX_ITEMS}
                    onChange={(n) => setQuantity(Math.min(GUEST_MAX_ITEMS, Math.max(1, Math.trunc(n) || 1)))}
                    className="h-11 w-full rounded-lg border-zinc-700 bg-zinc-900/40"
                  />
                  {!showQuantity ? (
                    <span className="block text-base text-zinc-600">Không áp dụng cho single object.</span>
                  ) : (
                    <span className="block text-base text-zinc-500">Guest chỉ được chọn tối đa {GUEST_MAX_ITEMS} records.</span>
                  )}
                </label>
              </div>

              <div>
                <div className="mb-3 flex min-h-7 items-center justify-between gap-3">
                  <span id="guest-chaos-label" className="text-base font-medium leading-none text-zinc-200">
                    Mô phỏng lỗi
                  </span>
                  <Switch
                    checked={chaosEnabled}
                    onCheckedChange={(v) => {
                      setChaosEnabled(v);
                      setRerollSeed(0);
                    }}
                    aria-labelledby="guest-chaos-label"
                  />
                </div>
                <NativeSelect
                  value={chaosCase}
                  onChange={(e) => setChaosCase(Number(e.target.value) as ChaosCaseId)}
                  disabled={!chaosEnabled}
                  ui="zinc"
                >
                  {CHAOS_CASES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </NativeSelect>
                <div className="mt-1.5 text-base text-zinc-500">
                  {chaosEnabled ? CHAOS_CASES.find((c) => c.id === chaosCase)?.hint : "Tắt mô phỏng lỗi để preview output ổn định."}
                </div>
              </div>

              <div>
                <div className="mb-3 flex min-h-7 items-center justify-between gap-3">
                  <span className="text-base font-medium leading-none text-zinc-200">Fields (max {GUEST_MAX_FIELDS})</span>
                  <button
                    type="button"
                    onClick={addField}
                    disabled={!canAddField}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-base font-semibold leading-none text-zinc-200 transition-colors hover:bg-zinc-800/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Thêm field
                  </button>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-2 text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1.35fr)_9.25rem_9.75rem_2.75rem] sm:items-center sm:gap-3">
                  <InlineLegendLabel
                    label="Key"
                    hintTitle='Tên field sẽ trở thành key trong JSON response (ví dụ: email → "email": ...).'
                    hintAriaLabel="Giải thích cột Key"
                  />
                  <InlineLegendLabel
                    label="Type"
                    hintTitle="Kiểu dữ liệu (format/cách sinh happy path) cho field."
                    hintAriaLabel="Giải thích cột Type"
                  />
                  <InlineLegendLabel
                    label="Faker"
                    hintTitle='Faker hint để sinh dữ liệu "đẹp" cho field theo kiểu đó.'
                    hintAriaLabel="Giải thích cột Faker"
                  />
                  <span className="hidden sm:block" aria-hidden="true" />
                </div>

                <ul className="space-y-3">
                  {fields.map((f) => (
                    <li
                      key={f.clientId}
                      className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-3 sm:grid-cols-[minmax(0,1.35fr)_9.25rem_9.75rem_2.75rem] sm:items-center sm:gap-3"
                    >
                      <input
                        aria-label="Key"
                        value={f.key}
                        onChange={(e) => updateField(f.clientId, { key: e.target.value })}
                        className="min-h-11 min-w-0 w-full rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2.5 font-mono text-[1.05rem] text-zinc-100 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                        placeholder="email"
                      />
                      <div className="min-w-0 w-full sm:w-[9.25rem] sm:max-w-[9.25rem] sm:justify-self-stretch">
                        <NativeSelect
                          aria-label="Kiểu dữ liệu"
                          value={f.type}
                          onChange={(e) => updateField(f.clientId, { type: e.target.value as FieldFormRow["type"] })}
                          ui="zincCompact"
                          className="!mt-0 !w-full !text-sm sm:!w-full"
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {TYPE_LABELS_VI[t] ?? t}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>

                      <div className="min-w-0 w-full sm:w-[9.75rem] sm:max-w-[9.75rem] sm:justify-self-stretch">
                        <NativeSelect
                          aria-label="Faker"
                          value={f.faker}
                          onChange={(e) => updateField(f.clientId, { faker: e.target.value })}
                          ui="zincCompact"
                          disabled={loadingHints}
                          className="!mt-0 !w-full !text-sm sm:!w-full"
                        >
                          <option value="">Mặc định</option>
                          {hints.fakerHints.map((h) => (
                            <option key={h} value={h}>
                              {FAKER_LABELS_VI[h] ?? h}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeField(f.clientId)}
                        disabled={fields.length <= 1}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-start rounded-lg border border-zinc-800 text-zinc-400 transition-colors hover:border-rose-500/40 hover:bg-rose-950/30 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40 sm:justify-self-end"
                        aria-label="Xóa field"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-base text-amber-100/90">
                  <div className="flex gap-2">
                    <Info className="mt-px h-4 w-4 shrink-0 text-amber-200" aria-hidden />
                    <div className="min-w-0 leading-snug">
                      Guest bị giới hạn thời gian và số lượng. Nếu bạn cần vượt 10 fields / 10 records, hãy đăng nhập.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => void release()}
                  disabled={releaseLoading}
                  className={dm.btn.primary + " w-full"}
                >
                  {releaseLoading ? "Đang release…" : "Release API (công khai)"}
                </button>
                <p className="mt-2 text-base text-amber-100/90">
                  {quotaLoading
                    ? "Đang tải quota…"
                    : quotaRemaining == null
                      ? "Quota tạm thời không sẵn sàng."
                      : `Còn ${quotaRemaining}/${quotaMax} lượt tạo trong 1 giờ.`}
                </p>
                <FieldError message={releaseErr} />
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/10 lg:basis-2/5">
              <div className="flex min-h-10 items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3">
                <span className="text-base font-semibold leading-none text-zinc-200">Live preview</span>
                <button
                  type="button"
                  onClick={() => setRerollSeed((s) => s + 1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-1.5 text-base font-semibold leading-none text-zinc-200 transition-colors hover:border-violet-500/50 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Reroll
                </button>
              </div>
              <div className="relative min-h-[320px] flex-1 bg-zinc-950/60">
                <JsonPreview value={previewValue} chaosCase={chaosCase} chaosFieldKey={chaosFieldKey} />
                {previewLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/65 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-900/90 px-4 py-3">
                      <LoadingSpinner size="sm" />
                      <span className="text-base text-zinc-300">Đang tạo preview...</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="border-t border-zinc-800/80 px-4 py-3 text-base text-zinc-500">
                {releasedUrl ? (
                  <div className="space-y-2">
                    <p className="text-emerald-400 font-medium">Đã release! URL:</p>
                    <code className="block break-all rounded-lg bg-zinc-900/80 px-3 py-2 font-mono text-base text-emerald-300">
                      {releasedUrl}
                    </code>
                    {expiresAt ? <p>Còn hạn tới: {new Date(expiresAt).toLocaleTimeString()}</p> : null}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(releasedUrl);
                        } catch {
                          /* clipboard */
                        }
                      }}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-base font-semibold text-zinc-200 hover:bg-zinc-800/40"
                    >
                      Copy URL
                    </button>
                  </div>
                ) : (
                  <p>
                    Chọn response + quantity + kiểu mô phỏng lỗi, sau đó bấm <span className="text-zinc-300 font-medium">Release API</span>.
                  </p>
                )}
              </div>
            </div>
            </div>
        </div>
      </div>

      {releaseDialogOpen && releasedUrl ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-release-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setReleaseDialogOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl">
            <p className="text-base font-medium uppercase tracking-wider text-zinc-400">
              Guest API đã sẵn sàng
            </p>
            <h3 id="guest-release-title" className="mt-1 text-lg font-semibold text-zinc-100">
              URL bạn cần gọi cuối cùng
            </h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-400">
              Cuối cùng, bạn chỉ cần gọi:
              <span className="ml-2 inline-flex max-w-full items-center rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1 font-mono text-base text-zinc-200 break-all whitespace-normal">
                GET {releasedUrl}
              </span>
            </p>
            {expiresAt ? (
              <p className="mt-2 text-base text-amber-200/90">
                Hết hạn lúc: {new Date(expiresAt).toLocaleString()}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(releasedUrl);
                  } catch {
                    /* ignore */
                  }
                }}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base font-semibold text-zinc-200 hover:bg-zinc-800/40"
              >
                Copy URL
              </button>
              <a
                href={releasedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-violet-500/15 px-3 py-2 text-base font-semibold text-violet-200 ring-1 ring-violet-500/30 hover:bg-violet-500/20"
              >
                Mở URL
              </a>
              <button
                type="button"
                onClick={() => setReleaseDialogOpen(false)}
                className="ml-auto inline-flex items-center justify-center rounded-xl border border-zinc-800 px-3 py-2 text-base font-semibold text-zinc-300 hover:bg-zinc-800/40"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

