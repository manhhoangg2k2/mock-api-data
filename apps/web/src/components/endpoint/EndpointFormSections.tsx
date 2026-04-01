import type { Dispatch, ReactNode, SetStateAction } from "react";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  IconBookPages,
  IconBox,
  IconBraces,
  IconCode,
  IconDice,
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
import { newRouletteRow } from "./schema-form";

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
      <section className="scroll-mt-8">
        <SectionHeading
          icon={<IconRoute size={20} className="text-sky-400/90" />}
          title="Đường dẫn & method"
          subtitle="Path tương đối trên mock URL của bạn."
          info={
            <div className="space-y-2">
              <p>Ví dụ <code className="text-sky-300">v1/items</code> → gọi mock tại /api/&lt;user&gt;/v1/items</p>
              <p>Chọn ít nhất một HTTP method được phép.</p>
            </div>
          }
        />
        <div className="space-y-5 pl-0 sm:pl-[52px]">
          <label className="block max-w-xl space-y-1.5">
            <span className="text-xs text-slate-400">Path</span>
            <input
              required
              value={p.path}
              onChange={(e) => p.setPath(e.target.value)}
              onFocus={() => p.setPathInputFocused(true)}
              onBlur={() => p.setPathInputFocused(false)}
              placeholder="v1/items"
              className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 font-mono text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-accent"
            />
            {p.pathInputFocused ? (
              <p className="text-[11px] leading-relaxed text-slate-500">
                Không có dấu <code className="text-slate-400">/</code> đầu. Khớp với URL public mock.
              </p>
            ) : null}
          </label>
          <fieldset>
            <legend className="sr-only">HTTP methods</legend>
            <div className="flex flex-wrap gap-2">
              {METHOD_OPTIONS.map((m) => (
                <label
                  key={m}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border bg-surface/60 px-3 py-2 text-sm transition has-[:checked]:border-accent/60 has-[:checked]:bg-accent/5 has-[:checked]:text-accent"
                >
                  <input
                    type="checkbox"
                    checked={p.methods.has(m)}
                    onChange={() => p.toggleMethod(m)}
                    className="rounded border-surface-border"
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {/* Body shape */}
      <section>
        <SectionHeading
          icon={<IconLayers size={20} className="text-violet-400/90" />}
          title="Dạng body"
          subtitle="Preset hay dùng — mở ? để so sánh chi tiết."
          info={
            <ul className="list-inside list-disc space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">Một object</strong> — resource đơn.
              </li>
              <li>
                <strong className="text-slate-200">Mảng N phần tử</strong> — không meta.
              </li>
              <li>
                <strong className="text-slate-200">Paginated</strong> — data + meta, ?limit &amp; page.
              </li>
              <li>
                <strong className="text-slate-200">Tùy chỉnh</strong> — tự bật object/array + pagination.
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
                  ? "border-accent/50 bg-accent/5 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
                  : "border-surface-border/80 bg-surface/40 hover:border-slate-600"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-border/30 text-slate-300">
                {SHAPE_ICON[preset.id]}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-100">{preset.title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                  {preset.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        {p.responsePreset === "array_list" && (
          <div className="mt-5 pl-0 sm:pl-[52px]">
            <label className="block max-w-[200px] space-y-1.5">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                Số phần tử
                <InfoPopover label="Số phần tử mảng" panelClassName="w-60">
                  <p className="text-slate-400">1–100. Mock thật trả đúng số này, không cần query.</p>
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
                className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600"
              />
            </label>
          </div>
        )}

        {p.responsePreset === "paginated" && (
          <div className="mt-5 space-y-4 rounded-2xl border border-surface-border/60 bg-surface/30 p-5 pl-5 sm:ml-[52px]">
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <IconListChecks size={14} />
              Query: <code className="text-slate-500">?limit=&amp;page=</code>
              <InfoPopover label="Paginated" panelClassName="w-64">
                <p className="text-slate-400">
                  Số hàng trong <code className="text-sky-300">data</code> = limit (tối đa 100).{" "}
                  <code className="text-sky-300">pageSize mặc định</code> dùng khi client không gửi limit.
                </p>
              </InfoPopover>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs text-slate-400">Page size mặc định</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={p.pageSizeDefault}
                  onChange={(e) =>
                    p.setPageSizeDefault(Math.min(100, Math.max(1, Number(e.target.value) || 20)))
                  }
                  placeholder="20"
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs text-slate-400">totalCount</span>
                <input
                  type="number"
                  min={1}
                  value={p.paginationTotal}
                  onChange={(e) => p.setPaginationTotal(Number(e.target.value) || 1)}
                  placeholder="1000000"
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600"
                />
              </label>
            </div>
          </div>
        )}

        {p.responsePreset === "custom" && (
          <details className="mt-5 sm:ml-[52px] group rounded-2xl border border-dashed border-slate-600/60 bg-surface/20 open:bg-surface/30">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs text-slate-400 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <IconSliders size={14} />
                Tùy chỉnh nâng cao
              </span>
            </summary>
            <div className="space-y-4 border-t border-surface-border/40 px-4 pb-4 pt-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="shape"
                    checked={p.responseShape === "object"}
                    onChange={() => p.goCustomShape("object")}
                  />
                  Object
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="shape"
                    checked={p.responseShape === "array"}
                    onChange={() => p.goCustomShape("array")}
                  />
                  Array
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={p.paginationEnabled}
                  onChange={(e) => p.goCustomPagination(e.target.checked)}
                />
                Virtual pagination
              </label>
              {p.paginationEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs text-slate-400">Page size mặc định</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={p.pageSizeDefault}
                      onChange={(e) =>
                        p.setPageSizeDefault(Math.min(100, Math.max(1, Number(e.target.value) || 20)))
                      }
                      className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-slate-400">totalCount</span>
                    <input
                      type="number"
                      min={1}
                      value={p.paginationTotal}
                      onChange={(e) => p.setPaginationTotal(Number(e.target.value) || 1)}
                      className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>
              )}
              {!p.paginationEnabled && p.responseShape === "array" && (
                <label className="block max-w-[200px] space-y-1.5">
                  <span className="text-xs text-slate-400">Số phần tử</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={p.arrayItemCount}
                    onChange={(e) =>
                      p.setArrayItemCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-white"
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
          icon={<IconGlobe size={20} className="text-emerald-400/90" />}
          title="Locale & template"
          subtitle="Ngôn ngữ Faker và lớp bọc JSON (tùy chọn)."
          info={
            <div className="space-y-2">
              <p>Locale ảnh hưởng tên, địa chỉ… Một số locale thiếu dữ liệu thì Faker fallback nội bộ.</p>
              <p>
                Template <strong className="text-slate-200">custom</strong> dùng chuỗi{" "}
                <code className="text-sky-300">"$body"</code> trong JSON để chèn payload sinh từ fields.
              </p>
            </div>
          }
        />
        <div className="space-y-6 pl-0 sm:pl-[52px]">
          <label className="block max-w-md space-y-1.5">
            <span className="text-xs text-slate-400">Faker locale</span>
            <select
              value={p.dataLocale}
              onChange={(e) => p.setDataLocale(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
            >
              {p.locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <IconBraces size={16} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-400">Response template</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {p.templatePresets.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => p.setResponseTemplateId(tp.id as ResponseTemplateIdStr)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    p.responseTemplateId === tp.id
                      ? "border-accent/50 bg-accent/5"
                      : "border-surface-border/80 bg-surface/40 hover:border-slate-600"
                  }`}
                >
                  <span className="block text-sm font-medium text-slate-100">{tp.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                    {tp.description}
                  </span>
                </button>
              ))}
            </div>
            {p.responseTemplateId === "json_api_like" && (
              <label className="mt-4 block max-w-sm space-y-1.5">
                <span className="text-xs text-slate-400">Resource type</span>
                <input
                  value={p.responseTemplateResourceType}
                  onChange={(e) => p.setResponseTemplateResourceType(e.target.value.slice(0, 64))}
                  placeholder="users"
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-white placeholder:text-slate-600"
                />
              </label>
            )}
            {p.responseTemplateId === "custom" && (
              <label className="mt-4 block space-y-1.5">
                <span className="flex items-center gap-1 text-xs text-slate-400">
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
                  className="w-full rounded-xl border border-surface-border bg-surface p-3 font-mono text-[11px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-accent"
                />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* Fields */}
      <section>
        <SectionHeading
          icon={<IconListChecks size={20} className="text-amber-400/90" />}
          title="Fields"
          subtitle="Cấu trúc dữ liệu sinh ra."
          info={
            <p>
              Mỗi field: key, kiểu, Faker tùy chọn. Mở <strong className="text-slate-200">Chaos</strong> khi cần
              test ngẫu nhiên omit / null / edge.
            </p>
          }
        />
        <div className="space-y-4 pl-0 sm:pl-[52px]">
          <button
            type="button"
            onClick={() => p.addField()}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface/60 px-4 py-2 text-xs text-slate-300 hover:border-accent/40 hover:text-accent"
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
      <details className="group rounded-2xl border border-surface-border/50 bg-surface/20 open:border-surface-border/80">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 text-sm text-slate-300 [&::-webkit-details-marker]:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-border/30 text-slate-400">
            <IconGauge size={18} />
          </span>
          <span className="flex-1 font-medium">Nâng cao</span>
          <span className="text-[11px] text-slate-500">Latency · Status roulette</span>
        </summary>
        <div className="space-y-6 border-t border-surface-border/40 px-4 pb-6 pt-5">
          <div className="grid max-w-md grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1 text-xs text-slate-400">
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
                className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-slate-400">Latency max (ms)</span>
              <input
                type="number"
                min={0}
                value={p.latencyMax}
                onChange={(e) => p.setLatencyMax(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600"
              />
            </label>
          </div>

          <div className="rounded-xl border border-surface-border/50 bg-surface/40 p-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={p.rouletteEnabled}
                onChange={(e) => p.setRouletteEnabled(e.target.checked)}
                className="rounded border-surface-border"
              />
              <IconDice size={16} className="text-slate-500" />
              Status roulette
              <InfoPopover label="Status roulette" panelClassName="w-60">
                <p>Trọng số theo mã HTTP. Tổng 0 hoặc tắt → luôn 200.</p>
              </InfoPopover>
            </label>
            {p.rouletteEnabled && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => p.setRouletteRows([newRouletteRow(200, 100)])}
                    className="rounded-lg border border-surface-border px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    200
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      p.setRouletteRows([
                        newRouletteRow(200, 92),
                        newRouletteRow(500, 5),
                        newRouletteRow(401, 3),
                      ])
                    }
                    className="rounded-lg border border-surface-border px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    92/5/3
                  </button>
                  <button
                    type="button"
                    onClick={() => p.setRouletteRows((r) => [...r, newRouletteRow(200, 10)])}
                    className="rounded-lg border border-surface-border px-2 py-1 text-xs text-accent"
                  >
                    + Dòng
                  </button>
                </div>
                <ul className="space-y-2">
                  {p.rouletteRows.map((r) => (
                    <li key={r.clientId} className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={100}
                        max={599}
                        value={r.code}
                        onChange={(e) =>
                          p.setRouletteRows((rows) =>
                            rows.map((x) =>
                              x.clientId === r.clientId
                                ? { ...x, code: Number(e.target.value) || 200 }
                                : x
                            )
                          )
                        }
                        className="w-24 rounded-lg border border-surface-border bg-surface px-2 py-1 text-sm text-white"
                      />
                      <span className="text-xs text-slate-500">w</span>
                      <input
                        type="number"
                        min={0}
                        value={r.weight}
                        onChange={(e) =>
                          p.setRouletteRows((rows) =>
                            rows.map((x) =>
                              x.clientId === r.clientId
                                ? { ...x, weight: Math.max(0, Number(e.target.value) || 0) }
                                : x
                            )
                          )
                        }
                        className="w-20 rounded-lg border border-surface-border bg-surface px-2 py-1 text-sm text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          p.setRouletteRows((rows) => rows.filter((x) => x.clientId !== r.clientId))
                        }
                        className="text-xs text-red-400 hover:underline"
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </details>

      <details className="group rounded-2xl border border-surface-border/40 bg-transparent">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-1 py-2 text-xs text-slate-500 [&::-webkit-details-marker]:hidden">
          <IconCode size={14} />
          schemaConfig JSON
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-surface-border/50 bg-surface/50 p-4 text-[11px] text-slate-500">
          {p.schemaJsonPretty}
        </pre>
      </details>
    </div>
  );
}
