import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { StepperInput } from "@/components/ui/StepperInput";
import { IconCode, IconGauge, IconPlus } from "@/components/ui/icons";
import { FieldError } from "@/components/ui/field-error";
import { SchemaFieldDense } from "./SchemaFieldDense";
import { StatusRouletteFields } from "./StatusRouletteFields";
import {
  METHOD_OPTIONS,
  RESPONSE_PRESETS,
  type EdgeCatalogGroup,
  type FieldFormRow,
  type ResponsePresetId,
  type ResponseTemplateIdStr,
  type StatusRouletteRow,
} from "./schema-form";
import type { DataLocaleRow, ResponseTemplatePresetMeta } from "./constants";

export type EndpointConfigFormProps = {
  path: string;
  setPath: (v: string) => void;
  pathInputFocused: boolean;
  setPathInputFocused: (v: boolean) => void;
  methods: Set<string>;
  toggleMethod: (m: string) => void;
  responsePreset: ResponsePresetId;
  setPreset: (id: ResponsePresetId) => void;
  responseShape: "object" | "array";
  paginationEnabled: boolean;
  arrayItemCount: number;
  setArrayItemCount: (n: number) => void;
  pageSizeDefault: number;
  setPageSizeDefault: (n: number) => void;
  paginationTotal: number;
  setPaginationTotal: (n: number) => void;
  paginationDefaultPage: number;
  setPaginationDefaultPage: (n: number) => void;
  goCustomShape: (s: "object" | "array") => void;
  goCustomPagination: (v: boolean) => void;
  locales: DataLocaleRow[];
  dataLocale: string;
  setDataLocale: (v: string) => void;
  templatePresets: ResponseTemplatePresetMeta[];
  responseTemplateId: ResponseTemplateIdStr;
  setResponseTemplateId: (v: ResponseTemplateIdStr) => void;
  responseTemplateResourceType: string;
  setResponseTemplateResourceType: (v: string) => void;
  responseTemplateCustomJson: string;
  setResponseTemplateCustomJson: (v: string) => void;
  fields: FieldFormRow[];
  updateField: (id: string, row: FieldFormRow) => void;
  removeField: (id: string) => void;
  addField: () => void;
  fakerHints: string[];
  edgePresets: string[];
  edgeCatalog?: EdgeCatalogGroup[];
  latencyMin: number;
  setLatencyMin: (n: number) => void;
  latencyMax: number;
  setLatencyMax: (n: number) => void;
  rouletteEnabled: boolean;
  setRouletteEnabled: (v: boolean) => void;
  rouletteRows: StatusRouletteRow[];
  setRouletteRows: Dispatch<SetStateAction<StatusRouletteRow[]>>;
  schemaJsonPretty: string;
  tourStep?: number | null;
  mockUrlPrefix?: string;
  formError?: string | null;
};

const labelSm = "mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500";
const inputSm =
  "h-8 w-full rounded-md border border-zinc-800 bg-zinc-800 px-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/25";

const PAGINATION_TOTAL_MAX = 999_999_999;
const LATENCY_MS_MAX = 120_000;

const PAGINATION_PAGE_SELECT_MAX = 200;

function PaginationDefaultPageField({
  pageSizeDefault,
  paginationTotal,
  value,
  onChange,
}: {
  pageSizeDefault: number;
  paginationTotal: number;
  value: number;
  onChange: (n: number) => void;
}) {
  const maxPage = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(Math.max(1, paginationTotal) / Math.min(100, Math.max(1, pageSizeDefault)))
      ),
    [paginationTotal, pageSizeDefault]
  );
  const v = Math.min(Math.max(1, value), maxPage);
  const useSelect = maxPage <= PAGINATION_PAGE_SELECT_MAX;

  return (
    <label className="min-w-[6.5rem] space-y-0.5">
      <span className={labelSm}>Trang mặc định</span>
      {useSelect ? (
        <NativeSelect
          ui="zinc"
          value={String(v)}
          onChange={(e) => onChange(Number(e.target.value) || 1)}
          className="!min-h-8 !text-xs"
        >
          {Array.from({ length: maxPage }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              {i + 1}/{maxPage}
            </option>
          ))}
        </NativeSelect>
      ) : (
        <StepperInput
          min={1}
          max={maxPage}
          step={1}
          value={v}
          onChange={onChange}
          className="w-full max-w-[9.5rem]"
        />
      )}
    </label>
  );
}

function fullMockUrl(prefix: string, path: string): string {
  const base = prefix.replace(/\/+$/, "");
  const seg = path.replace(/^\/+/, "").trim();
  return seg ? `${base}/${seg}` : `${base}/…`;
}

export function EndpointConfigForm(p: EndpointConfigFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const tourStep = p.tourStep;

  useEffect(() => {
    if (tourStep === 6) setAdvancedOpen(true);
  }, [tourStep]);

  const advancedDetailsOpen = tourStep === 6 || advancedOpen;

  return (
    <div className="space-y-5">
      {/* Path + methods */}
      <section data-tour="path-methods" className="scroll-mt-4 space-y-2">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[160px] flex-1 space-y-0.5">
            <span className={labelSm}>Đường dẫn</span>
            <input
              required
              value={p.path}
              onChange={(e) => p.setPath(e.target.value)}
              onFocus={() => p.setPathInputFocused(true)}
              onBlur={() => p.setPathInputFocused(false)}
              placeholder="v1/items"
              aria-invalid={Boolean(p.formError)}
              aria-describedby={p.formError ? "endpoint-form-error" : undefined}
              className={inputSm + " font-mono"}
            />
          </label>
        </div>
        {p.mockUrlPrefix ? (
          <p className="text-[10px] leading-relaxed text-zinc-500">
            URL mock đầy đủ:{" "}
            <code className="break-all font-mono text-[10px] text-violet-300/90">
              {fullMockUrl(p.mockUrlPrefix, p.path)}
            </code>
          </p>
        ) : null}
        {p.pathInputFocused ? (
          <p className="text-[10px] text-zinc-500">Không gõ <code className="text-zinc-400">/</code> đầu.</p>
        ) : null}
        <FieldError
          id="endpoint-form-error"
          message={p.formError}
          size="compact"
          className="font-medium"
        />
        <div>
          <span className={labelSm}>HTTP methods</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {METHOD_OPTIONS.map((m) => {
              const on = p.methods.has(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => p.toggleMethod(m)}
                  className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium transition ${
                    on
                      ? "border-violet-500/55 bg-violet-500/15 text-violet-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.28)]"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Body shape — compact */}
      <section data-tour="response-body" className="space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[200px] flex-1 space-y-0.5">
            <span className={labelSm}>Dạng body</span>
            <NativeSelect
              ui="zinc"
              value={p.responsePreset}
              onChange={(e) => p.setPreset(e.target.value as ResponsePresetId)}
              className="!min-h-8 !rounded-md !py-1 !text-xs"
            >
              {RESPONSE_PRESETS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </NativeSelect>
          </label>
          {p.responsePreset === "array_list" ? (
            <label className="w-[7.5rem] space-y-0.5">
              <span className={labelSm}>N</span>
              <StepperInput
                min={1}
                max={100}
                step={1}
                value={p.arrayItemCount}
                onChange={(n) => p.setArrayItemCount(n)}
                className="w-full"
              />
            </label>
          ) : null}
        </div>

        {p.responsePreset === "paginated" ? (
          <div className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
            <label className="space-y-0.5">
              <span className={labelSm}>Page size</span>
              <StepperInput
                min={1}
                max={100}
                step={1}
                value={p.pageSizeDefault}
                onChange={(n) => p.setPageSizeDefault(n)}
                className="w-[7.25rem]"
              />
            </label>
            <label className="space-y-0.5">
              <span className={labelSm}>totalCount</span>
              <StepperInput
                min={1}
                max={PAGINATION_TOTAL_MAX}
                step={10}
                value={Math.min(p.paginationTotal, PAGINATION_TOTAL_MAX)}
                onChange={(n) => p.setPaginationTotal(n)}
                className="w-[8.5rem]"
              />
            </label>
            <PaginationDefaultPageField
              pageSizeDefault={p.pageSizeDefault}
              paginationTotal={p.paginationTotal}
              value={p.paginationDefaultPage}
              onChange={p.setPaginationDefaultPage}
            />
          </div>
        ) : null}

        {p.responsePreset === "custom" ? (
          <div className="space-y-2 rounded-md border border-dashed border-zinc-700 bg-zinc-900/30 p-2">
            <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="shape"
                  checked={p.responseShape === "object"}
                  onChange={() => p.goCustomShape("object")}
                  className="border-zinc-600 accent-violet-500"
                />
                Object
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="shape"
                  checked={p.responseShape === "array"}
                  onChange={() => p.goCustomShape("array")}
                  className="border-zinc-600 accent-violet-500"
                />
                Array
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={p.paginationEnabled}
                  onChange={(e) => p.goCustomPagination(e.target.checked)}
                  className="rounded border-zinc-700 accent-violet-500"
                />
                Pagination
              </label>
            </div>
            {p.paginationEnabled ? (
              <div className="flex flex-wrap items-end gap-3">
                <label className="space-y-0.5">
                  <span className={labelSm}>Page size</span>
                  <StepperInput
                    min={1}
                    max={100}
                    step={1}
                    value={p.pageSizeDefault}
                    onChange={(n) => p.setPageSizeDefault(n)}
                    className="w-[7.25rem]"
                  />
                </label>
                <label className="space-y-0.5">
                  <span className={labelSm}>totalCount</span>
                  <StepperInput
                    min={1}
                    max={PAGINATION_TOTAL_MAX}
                    step={10}
                    value={Math.min(p.paginationTotal, PAGINATION_TOTAL_MAX)}
                    onChange={(n) => p.setPaginationTotal(n)}
                    className="w-[8.5rem]"
                  />
                </label>
                <PaginationDefaultPageField
                  pageSizeDefault={p.pageSizeDefault}
                  paginationTotal={p.paginationTotal}
                  value={p.paginationDefaultPage}
                  onChange={p.setPaginationDefaultPage}
                />
              </div>
            ) : p.responseShape === "array" ? (
              <label className="flex flex-col gap-0.5">
                <span className={labelSm}>Số phần tử</span>
                <StepperInput
                  min={1}
                  max={100}
                  step={1}
                  value={p.arrayItemCount}
                  onChange={(n) => p.setArrayItemCount(n)}
                  className="w-[7.25rem]"
                />
              </label>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Locale + response layout (template) */}
      <section data-tour="response-layout" className="scroll-mt-4 space-y-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-0.5">
            <span className={labelSm}>Faker locale</span>
            <NativeSelect
              ui="zinc"
              value={p.dataLocale}
              onChange={(e) => p.setDataLocale(e.target.value)}
              className="!min-h-8 !text-xs"
            >
              {p.locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-0.5">
            <span className={labelSm}>Layout JSON trả về</span>
            <NativeSelect
              ui="zinc"
              value={p.responseTemplateId}
              onChange={(e) => p.setResponseTemplateId(e.target.value as ResponseTemplateIdStr)}
              className="!min-h-8 !text-xs"
            >
              {p.templatePresets.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.title}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>
        <p className="text-[10px] text-zinc-500">
          Bọc payload: raw, {"{ success, body }"}, JSON:API, custom với{" "}
          <code className="text-violet-300">$body</code>.
          <InfoPopover label="Template" panelClassName="w-64">
            <p className="text-xs text-zinc-400">Chọn preset hoặc custom JSON có chuỗi &quot;$body&quot;.</p>
          </InfoPopover>
        </p>
        {p.responseTemplateId === "json_api_like" ? (
          <label className="space-y-0.5">
            <span className={labelSm}>Resource type</span>
            <input
              value={p.responseTemplateResourceType}
              onChange={(e) => p.setResponseTemplateResourceType(e.target.value.slice(0, 64))}
              placeholder="users"
              className={inputSm + " font-mono"}
            />
          </label>
        ) : null}
        {p.responseTemplateId === "custom" ? (
          <label className="space-y-0.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Custom JSON
              <InfoPopover label="Custom" panelClassName="w-56">
                <p className="text-xs">Phải có ít nhất một giá trị đúng bằng &quot;$body&quot;.</p>
              </InfoPopover>
            </span>
            <textarea
              value={p.responseTemplateCustomJson}
              onChange={(e) => p.setResponseTemplateCustomJson(e.target.value)}
              rows={5}
              spellCheck={false}
              placeholder='{ "data": "$body" }'
              className="w-full rounded-md border border-zinc-800 bg-zinc-800 p-2 font-mono text-[11px] text-zinc-200 outline-none focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/25"
            />
          </label>
        ) : null}
      </section>

      {/* Fields */}
      <section data-tour="fields-schema" className="scroll-mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className={labelSm + " mb-0"}>Fields</span>
          <button
            type="button"
            onClick={() => p.addField()}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-[10px] font-medium text-zinc-400 hover:border-violet-500/45 hover:text-violet-300"
          >
            <IconPlus size={12} />
            Thêm
          </button>
        </div>
        <div className="overflow-hidden rounded-md border border-zinc-800">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_28px] gap-1.5 border-b border-zinc-800 bg-zinc-900/80 px-2 py-1">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Key</span>
            <div className="grid grid-cols-2 gap-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Kiểu</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Faker</span>
            </div>
            <span />
          </div>
          {p.fields.map((row, i) => (
            <SchemaFieldDense
              key={row.clientId}
              row={row}
              onChange={(next) => p.updateField(row.clientId, next)}
              onRemove={() => p.removeField(row.clientId)}
              fakerHints={p.fakerHints}
              edgePresets={p.edgePresets}
              edgeCatalog={p.edgeCatalog}
              variantsTourTarget={i === 0}
              tourExpandVariants={tourStep === 4 && i === 0}
            />
          ))}
        </div>
      </section>

      <details
        data-tour="advanced-section"
        className="scroll-mt-4 rounded-md border border-zinc-800 bg-zinc-900/25"
        open={advancedDetailsOpen}
        onToggle={(e) => {
          if (tourStep === 6) return;
          setAdvancedOpen(e.currentTarget.open);
        }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-2 text-xs text-zinc-400 [&::-webkit-details-marker]:hidden">
          <IconGauge size={14} className="text-zinc-500" />
          Nâng cao · Latency · Roulette
        </summary>
        <div className="space-y-4 border-t border-zinc-800 px-2 py-3">
          <div className="grid max-w-md grid-cols-2 gap-3">
            <label className="space-y-0.5">
              <span className={labelSm}>Latency min (ms)</span>
              <StepperInput
                min={0}
                max={LATENCY_MS_MAX}
                step={50}
                value={Math.min(p.latencyMin, LATENCY_MS_MAX)}
                onChange={(n) => p.setLatencyMin(n)}
                className="w-full"
              />
            </label>
            <label className="space-y-0.5">
              <span className={labelSm}>Latency max (ms)</span>
              <StepperInput
                min={0}
                max={LATENCY_MS_MAX}
                step={50}
                value={Math.min(p.latencyMax, LATENCY_MS_MAX)}
                onChange={(n) => p.setLatencyMax(n)}
                className="w-full"
              />
            </label>
          </div>
          <StatusRouletteFields
            enabled={p.rouletteEnabled}
            setEnabled={p.setRouletteEnabled}
            rows={p.rouletteRows}
            setRows={p.setRouletteRows}
          />
        </div>
      </details>

      <details className="rounded-md border border-zinc-800/80">
        <summary className="cursor-pointer list-none px-2 py-1.5 text-[10px] text-zinc-500 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1">
            <IconCode size={12} />
            schemaConfig JSON
          </span>
        </summary>
        <pre className="max-h-40 overflow-auto border-t border-zinc-800 bg-zinc-950 p-2 font-mono text-[10px] text-zinc-500">
          {p.schemaJsonPretty}
        </pre>
      </details>
    </div>
  );
}
