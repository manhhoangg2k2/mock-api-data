import type { Dispatch, ReactNode, SetStateAction } from "react";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  IconBookPages,
  IconBox,
  IconBraces,
  IconCode,
  IconGauge,
  IconGlobe,
  IconLayers,
  IconListChecks,
  IconPlus,
  IconRoute,
  IconSliders,
} from "@/components/ui/icons";
import { SchemaFieldRow } from "./SchemaFieldRow";
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
import { StatusRouletteFields } from "./StatusRouletteFields";

const SHAPE_ICON: Record<ResponsePresetId, ReactNode> = {
  single_object: <IconBox size={18} />,
  array_list: <IconLayers size={18} />,
  paginated: <IconBookPages size={18} />,
  custom: <IconSliders size={18} />,
};

export type EndpointFormSectionsProps = {
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
};

export function EndpointFormSections(p: EndpointFormSectionsProps) {
  return (
    <div className="space-y-12">
      {/* Path & methods */}
      <section data-tour="path-methods" className="scroll-mt-8">
        <SectionHeading
          icon={<IconRoute size={20} className="text-violet-400/90" />}
          title="Đường dẫn & method"
          subtitle="Path tương đối trên mock URL của bạn."
          info={
            <div className="space-y-2">
              <p>Ví dụ <code className="text-violet-300">v1/items</code> → gọi mock tại /api/&lt;user&gt;/v1/items</p>
              <p>Chọn ít nhất một HTTP method được phép.</p>
            </div>
          }
        />
        <div className="space-y-5 pl-0 sm:pl-[52px]">
          <label className="block max-w-xl space-y-1.5">
            <span className="text-base text-zinc-400">Path</span>
            <input
              required
              value={p.path}
              onChange={(e) => p.setPath(e.target.value)}
              onFocus={() => p.setPathInputFocused(true)}
              onBlur={() => p.setPathInputFocused(false)}
              placeholder="v1/items"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/25"
            />
            {p.pathInputFocused ? (
              <p className="text-base leading-relaxed text-zinc-500">
                Không có dấu <code className="text-zinc-400">/</code> đầu. Khớp với URL public mock.
              </p>
            ) : null}
          </label>
          <fieldset>
            <legend className="sr-only">HTTP methods</legend>
            <div className="flex flex-wrap gap-2">
              {METHOD_OPTIONS.map((m) => (
                <label
                  key={m}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-base text-zinc-300 transition has-[:checked]:border-violet-500/55 has-[:checked]:bg-violet-500/10 has-[:checked]:text-violet-300"
                >
                  <input
                    type="checkbox"
                    checked={p.methods.has(m)}
                    onChange={() => p.toggleMethod(m)}
                    className="rounded border-zinc-700 accent-violet-500"
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {/* Body shape */}
      <section data-tour="response-body">
        <SectionHeading
          icon={<IconLayers size={20} className="text-violet-400/90" />}
          title="Dạng body"
          subtitle="Preset hay dùng — mở ? để so sánh chi tiết."
          info={
            <ul className="list-inside list-disc space-y-1 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Một object</strong> — resource đơn.
              </li>
              <li>
                <strong className="text-zinc-200">Mảng N phần tử</strong> — không meta.
              </li>
              <li>
                <strong className="text-zinc-200">Paginated</strong> — data + meta, ?limit &amp; page.
              </li>
              <li>
                <strong className="text-zinc-200">Tùy chỉnh</strong> — tự bật object/array + pagination.
              </li>
            </ul>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 pl-0 sm:pl-[52px]">
          {RESPONSE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => p.setPreset(preset.id)}
              className={`flex gap-3 rounded-2xl border p-4 text-left transition ${
                p.responsePreset === preset.id
                  ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.22)]"
                  : "border-zinc-800/90 bg-zinc-900/40 hover:border-zinc-600"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800/50 text-zinc-300">
                {SHAPE_ICON[preset.id]}
              </span>
              <span className="min-w-0">
                <span className="block text-base font-medium text-zinc-100">{preset.title}</span>
                <span className="mt-0.5 block text-base leading-snug text-zinc-500">
                  {preset.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        {p.responsePreset === "array_list" && (
          <div className="mt-5 pl-0 sm:pl-[52px]">
            <label className="block max-w-[200px] space-y-1.5">
              <span className="flex items-center gap-1 text-base text-zinc-400">
                Số phần tử
                <InfoPopover label="Số phần tử mảng" panelClassName="w-60">
                  <p className="text-zinc-400">1–100. Mock thật trả đúng số này, không cần query.</p>
                </InfoPopover>
              </span>
              <input
                type="number"
                min={1}
                max={100}
                value={p.arrayItemCount}
                onChange={(e) =>
                  p.setArrayItemCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
                }
                placeholder="5"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600"
              />
            </label>
          </div>
        )}

        {p.responsePreset === "paginated" && (
          <div className="mt-5 space-y-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/35 p-5 pl-5 sm:ml-[52px]">
            <p className="flex items-center gap-2 text-base text-zinc-400">
              <IconListChecks size={14} />
              Query: <code className="text-zinc-500">?limit=&amp;page=</code>
              <InfoPopover label="Paginated" panelClassName="w-64">
                <p className="text-zinc-400">
                  Số hàng trong <code className="text-violet-300">data</code> = limit (tối đa 100).{" "}
                  <code className="text-violet-300">pageSize mặc định</code> dùng khi client không gửi limit.
                </p>
              </InfoPopover>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-base text-zinc-400">Page size mặc định</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={p.pageSizeDefault}
                  onChange={(e) =>
                    p.setPageSizeDefault(Math.min(100, Math.max(1, Number(e.target.value) || 20)))
                  }
                  placeholder="20"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-base text-zinc-400">totalCount</span>
                <input
                  type="number"
                  min={1}
                  value={p.paginationTotal}
                  onChange={(e) => p.setPaginationTotal(Number(e.target.value) || 1)}
                  placeholder="1000000"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600"
                />
              </label>
            </div>
          </div>
        )}

        {p.responsePreset === "custom" && (
          <details className="mt-5 sm:ml-[52px] group rounded-2xl border border-dashed border-zinc-600/60 bg-zinc-900/25 open:bg-zinc-900/35">
            <summary className="cursor-pointer list-none px-4 py-3 text-base text-zinc-400 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <IconSliders size={14} />
                Tùy chỉnh nâng cao
              </span>
            </summary>
            <div className="space-y-4 border-t border-zinc-800/40 px-4 pb-4 pt-4">
              <div className="flex flex-wrap gap-4 text-base">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="shape"
                    checked={p.responseShape === "object"}
                    onChange={() => p.goCustomShape("object")}
                    className="border-zinc-600 accent-violet-500"
                  />
                  Object
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="shape"
                    checked={p.responseShape === "array"}
                    onChange={() => p.goCustomShape("array")}
                    className="border-zinc-600 accent-violet-500"
                  />
                  Array
                </label>
              </div>
              <label className="flex items-center gap-2 text-base text-zinc-300">
                <input
                  type="checkbox"
                  checked={p.paginationEnabled}
                  onChange={(e) => p.goCustomPagination(e.target.checked)}
                  className="rounded border-zinc-700 accent-violet-500"
                />
                Virtual pagination
              </label>
              {p.paginationEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-base text-zinc-400">Page size mặc định</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={p.pageSizeDefault}
                      onChange={(e) =>
                        p.setPageSizeDefault(Math.min(100, Math.max(1, Number(e.target.value) || 20)))
                      }
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/25"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-base text-zinc-400">totalCount</span>
                    <input
                      type="number"
                      min={1}
                      value={p.paginationTotal}
                      onChange={(e) => p.setPaginationTotal(Number(e.target.value) || 1)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/25"
                    />
                  </label>
                </div>
              )}
              {!p.paginationEnabled && p.responseShape === "array" && (
                <label className="block max-w-[200px] space-y-1.5">
                  <span className="text-base text-zinc-400">Số phần tử</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={p.arrayItemCount}
                    onChange={(e) =>
                      p.setArrayItemCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/25"
                  />
                </label>
              )}
            </div>
          </details>
        )}
      </section>

      {/* Locale + template */}
      <section>
        <SectionHeading
          icon={<IconGlobe size={20} className="text-violet-400/90" />}
          title="Locale & template"
          subtitle="Ngôn ngữ Faker và lớp bọc JSON (tùy chọn)."
          info={
            <div className="space-y-2">
              <p>Locale ảnh hưởng tên, địa chỉ… Một số locale thiếu dữ liệu thì Faker fallback nội bộ.</p>
              <p>
                Template <strong className="text-zinc-200">custom</strong> dùng chuỗi{" "}
                <code className="text-violet-300">"$body"</code> trong JSON để chèn payload sinh từ fields.
              </p>
            </div>
          }
        />
        <div className="space-y-6 pl-0 sm:pl-[52px]">
          <label className="block max-w-md space-y-1.5">
            <span className="text-base text-zinc-400">Faker locale</span>
            <NativeSelect ui="surface" value={p.dataLocale} onChange={(e) => p.setDataLocale(e.target.value)}>
              {p.locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </NativeSelect>
          </label>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <IconBraces size={16} className="text-zinc-500" />
              <span className="text-base font-medium text-zinc-400">Response template</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {p.templatePresets.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => p.setResponseTemplateId(tp.id as ResponseTemplateIdStr)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    p.responseTemplateId === tp.id
                      ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
                      : "border-zinc-800/90 bg-zinc-900/40 hover:border-zinc-600"
                  }`}
                >
                  <span className="block text-base font-medium text-zinc-100">{tp.title}</span>
                  <span className="mt-0.5 block text-base leading-snug text-zinc-500">
                    {tp.description}
                  </span>
                </button>
              ))}
            </div>
            {p.responseTemplateId === "json_api_like" && (
              <label className="mt-4 block max-w-sm space-y-1.5">
                <span className="text-base text-zinc-400">Resource type</span>
                <input
                  value={p.responseTemplateResourceType}
                  onChange={(e) => p.setResponseTemplateResourceType(e.target.value.slice(0, 64))}
                  placeholder="users"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-base text-zinc-100 placeholder:text-zinc-600"
                />
              </label>
            )}
            {p.responseTemplateId === "custom" && (
              <label className="mt-4 block space-y-1.5">
                <span className="flex items-center gap-1 text-base text-zinc-400">
                  JSON
                  <InfoPopover label="Custom JSON" panelClassName="w-64">
                    <p>Object hoặc array. Phải có ít nhất một giá trị đúng bằng chuỗi "$body".</p>
                  </InfoPopover>
                </span>
                <textarea
                  value={p.responseTemplateCustomJson}
                  onChange={(e) => p.setResponseTemplateCustomJson(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  placeholder='{ "data": "$body" }'
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-base text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/25"
                />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* Fields */}
      <section data-tour="fields-schema">
        <SectionHeading
          icon={<IconListChecks size={20} className="text-violet-400/90" />}
          title="Fields"
          subtitle="Cấu trúc dữ liệu sinh ra."
          info={
            <p>
              Mỗi field: key, kiểu, Faker tùy chọn. Mở <strong className="text-zinc-200">Mô phỏng lỗi</strong> khi cần
              test ngẫu nhiên omit / null / edge.
            </p>
          }
        />
        <div className="space-y-4 pl-0 sm:pl-[52px]">
          <button
            type="button"
            onClick={() => p.addField()}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-base text-zinc-300 hover:border-violet-500/45 hover:text-violet-300"
          >
            <IconPlus size={14} />
            Thêm field
          </button>
          <div className="space-y-4">
            {p.fields.map((row) => (
              <SchemaFieldRow
                key={row.clientId}
                row={row}
                onChange={(next) => p.updateField(row.clientId, next)}
                onRemove={() => p.removeField(row.clientId)}
                fakerHints={p.fakerHints}
                edgePresets={p.edgePresets}
                edgeCatalog={p.edgeCatalog}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Advanced: progressive disclosure */}
      <details className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/25 open:border-zinc-800/80">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 text-base text-zinc-300 [&::-webkit-details-marker]:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50 text-zinc-400">
            <IconGauge size={18} />
          </span>
          <span className="flex-1 font-medium">Nâng cao</span>
          <span className="text-base text-zinc-500">Latency · Status roulette</span>
        </summary>
        <div className="space-y-6 border-t border-zinc-800/40 px-4 pb-6 pt-5">
          <div className="grid max-w-md grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1 text-base text-zinc-400">
                Latency min (ms)
                <InfoPopover label="Latency" panelClassName="w-56">
                  <p>Trễ ngẫu nhiên trong khoảng min–max trước khi trả body (ms).</p>
                </InfoPopover>
              </span>
              <input
                type="number"
                min={0}
                value={p.latencyMin}
                onChange={(e) => p.setLatencyMin(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-base text-zinc-400">Latency max (ms)</span>
              <input
                type="number"
                min={0}
                value={p.latencyMax}
                onChange={(e) => p.setLatencyMax(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600"
              />
            </label>
          </div>

          <StatusRouletteFields
            enabled={p.rouletteEnabled}
            setEnabled={p.setRouletteEnabled}
            rows={p.rouletteRows}
            setRows={p.setRouletteRows}
            comfortable
          />
        </div>
      </details>

      <details className="group rounded-2xl border border-zinc-800/40 bg-transparent">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-1 py-2 text-base text-zinc-500 [&::-webkit-details-marker]:hidden">
          <IconCode size={14} />
          schemaConfig JSON
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 text-base text-zinc-500">
          {p.schemaJsonPretty}
        </pre>
      </details>
    </div>
  );
}
