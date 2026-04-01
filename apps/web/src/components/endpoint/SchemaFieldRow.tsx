import type { EdgeCatalogGroup, FieldFormRow } from "./schema-form";
import {
  EDGE_HELP_VI,
  EDGE_LABELS_VI,
  FIELD_TYPES,
  FAKER_LABELS_VI,
  TYPE_LABELS_VI,
} from "./schema-form";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { IconTrash, IconZap } from "@/components/ui/icons";

type Props = {
  row: FieldFormRow;
  onChange: (next: FieldFormRow) => void;
  onRemove: () => void;
  fakerHints: string[];
  edgePresets: string[];
  edgeCatalog?: EdgeCatalogGroup[];
};

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 text-xs text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums text-slate-300">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-1.5 w-full accent-accent"
        aria-label={label}
      />
    </div>
  );
}

export function SchemaFieldRow({
  row,
  onChange,
  onRemove,
  fakerHints,
  edgePresets,
  edgeCatalog,
}: Props) {
  const chaosActive = row.omitPercent > 0 || row.nullPercent > 0 || row.edgePercent > 0;

  return (
    <div className="rounded-2xl border border-surface-border/70 bg-surface/40 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[100px] flex-1 space-y-1.5">
          <span className="text-xs text-slate-400">Key</span>
          <input
            value={row.key}
            onChange={(e) => onChange({ ...row, key: e.target.value })}
            placeholder="email"
            className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-accent"
          />
        </label>
        <label className="min-w-[130px] flex-1 space-y-1.5">
          <span className="text-xs text-slate-400">Kiểu</span>
          <select
            value={row.type}
            onChange={(e) =>
              onChange({ ...row, type: e.target.value as FieldFormRow["type"], faker: "" })
            }
            className="w-full rounded-xl border border-surface-border bg-surface-raised px-2 py-2 text-sm text-white outline-none focus:border-accent"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS_VI[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[140px] flex-1 space-y-1.5">
          <span className="text-xs text-slate-400">Faker</span>
          <select
            value={row.faker}
            onChange={(e) => onChange({ ...row, faker: e.target.value })}
            className="w-full rounded-xl border border-surface-border bg-surface-raised px-2 py-2 text-sm text-white outline-none focus:border-accent"
          >
            <option value="">Mặc định</option>
            {fakerHints.map((h) => (
              <option key={h} value={h}>
                {FAKER_LABELS_VI[h] ?? h}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border text-slate-500 hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400"
          aria-label="Xóa field"
        >
          <IconTrash size={16} />
        </button>
      </div>

      <details
        className="mt-4 rounded-xl border border-surface-border/50 bg-surface/30 open:border-surface-border/70"
        open={chaosActive}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs text-slate-400 [&::-webkit-details-marker]:hidden">
          <IconZap size={14} className={chaosActive ? "text-amber-400/90" : "text-slate-600"} />
          <span className="font-medium text-slate-300">Chaos</span>
          {chaosActive ? (
            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-200/90">
              bật
            </span>
          ) : (
            <span className="text-[10px] text-slate-600">tùy chọn</span>
          )}
          <span className="ml-auto">
            <InfoPopover label="Chaos là gì?" panelClassName="w-72">
              <div className="space-y-2 text-slate-400">
                <p>Mỗi lần gọi API, field có thể ra giá trị “đẹp” hoặc biến dạng theo %.</p>
                <ul className="list-inside list-disc space-y-1 text-[11px]">
                  <li>
                    <strong className="text-slate-200">Omit</strong> — bỏ key khỏi JSON.
                  </li>
                  <li>
                    <strong className="text-slate-200">Null</strong> — giá trị null.
                  </li>
                  <li>
                    <strong className="text-slate-200">Edge</strong> — preset xấu (cần Edge % &gt; 0).
                  </li>
                </ul>
                <p className="text-[11px] text-slate-500">
                  Dùng Stress preview (panel phải) để dễ bắt gặp hơn.
                </p>
              </div>
            </InfoPopover>
          </span>
        </summary>
        <div className="space-y-4 border-t border-surface-border/40 px-3 pb-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <SliderRow
              label="Omit"
              value={row.omitPercent}
              onChange={(n) => onChange({ ...row, omitPercent: n })}
            />
            <SliderRow
              label="Null"
              value={row.nullPercent}
              onChange={(n) => onChange({ ...row, nullPercent: n })}
            />
            <SliderRow
              label="Edge"
              value={row.edgePercent}
              onChange={(n) => onChange({ ...row, edgePercent: n })}
            />
          </div>
          <label className="block max-w-md space-y-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              Edge preset
              <InfoPopover label="Edge preset" panelClassName="w-72">
                <p className="mb-2 text-slate-400">Chọn kiểu giá trị “xấu” khi Edge % kích hoạt.</p>
                <p className="text-[11px] text-slate-500">
                  Mô tả chi tiết từng preset hiện dưới dropdown khi Edge % &gt; 0.
                </p>
              </InfoPopover>
            </span>
            <select
              value={row.edgePreset}
              onChange={(e) => onChange({ ...row, edgePreset: e.target.value })}
              disabled={row.edgePercent <= 0}
              className="w-full rounded-xl border border-surface-border bg-surface px-2 py-2 text-sm text-white outline-none focus:border-accent disabled:opacity-40"
            >
              {edgeCatalog && edgeCatalog.length > 0
                ? edgeCatalog.map((g) => (
                    <optgroup key={g.id} label={g.labelVi}>
                      {g.items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.labelVi}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : edgePresets.map((id) => (
                    <option key={id} value={id}>
                      {EDGE_LABELS_VI[id] ?? id}
                    </option>
                  ))}
            </select>
            {row.edgePercent > 0 ? (
              <p className="text-[11px] leading-snug text-slate-500">
                {EDGE_HELP_VI[row.edgePreset] ?? "Giá trị stress cho preset này."}
              </p>
            ) : null}
          </label>
        </div>
      </details>
    </div>
  );
}
