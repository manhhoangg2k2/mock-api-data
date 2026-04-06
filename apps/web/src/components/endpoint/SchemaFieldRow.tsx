import type { EdgeCatalogGroup, FieldFormRow } from "./schema-form";
import {
  applyEdgePercent,
  applyNullPercent,
  applyOmitPercent,
  EDGE_HELP_VI,
  EDGE_LABELS_VI,
  FIELD_TYPES,
  FAKER_LABELS_VI,
  TYPE_LABELS_VI,
} from "./schema-form";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { NativeSelect } from "@/components/ui/NativeSelect";
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
  max = 100,
  onChange,
}: {
  label: string;
  value: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 text-xs text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums text-zinc-300">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(value, max)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-1.5 w-full accent-violet-500"
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
  const variantActive = row.omitPercent > 0 || row.nullPercent > 0 || row.edgePercent > 0;
  const happyPercent = Math.max(0, 100 - row.omitPercent - row.nullPercent - row.edgePercent);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="min-w-[100px] flex-1 space-y-1.5">
          <span className="text-xs text-zinc-400">Key</span>
          <input
            value={row.key}
            onChange={(e) => onChange({ ...row, key: e.target.value })}
            placeholder="email"
            className="min-h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/25"
          />
        </label>
        <label className="min-w-[130px] flex-1 space-y-1.5">
          <span className="text-xs text-zinc-400">Kiểu</span>
          <NativeSelect
            ui="surfaceRaised"
            value={row.type}
            onChange={(e) =>
              onChange({ ...row, type: e.target.value as FieldFormRow["type"], faker: "" })
            }
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS_VI[t] ?? t}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="min-w-[140px] flex-1 space-y-1.5">
          <span className="text-xs text-zinc-400">Faker</span>
          <NativeSelect
            ui="surfaceRaised"
            value={row.faker}
            onChange={(e) => onChange({ ...row, faker: e.target.value })}
          >
            <option value="">Mặc định</option>
            {fakerHints.map((h) => (
              <option key={h} value={h}>
                {FAKER_LABELS_VI[h] ?? h}
              </option>
            ))}
          </NativeSelect>
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400"
          aria-label="Xóa field"
        >
          <IconTrash size={16} />
        </button>
      </div>

      <details
        className="mt-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 open:border-zinc-700"
        open={variantActive}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs text-zinc-400 [&::-webkit-details-marker]:hidden">
          <IconZap size={14} className={variantActive ? "text-rose-400/90" : "text-zinc-600"} />
          <span className="font-medium text-zinc-300">Mô phỏng lỗi dữ liệu</span>
          {variantActive ? (
            <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-200/90">
              bật
            </span>
          ) : (
            <span className="text-[10px] text-zinc-600">tùy chọn</span>
          )}
          <span className="ml-auto">
            <InfoPopover label="Cách hoạt động" panelClassName="w-72">
              <div className="space-y-2 text-zinc-400">
                <p>
                  Ba tỷ lệ (bỏ trường · null · giá trị xấu) không vượt quá 100% tổng; phần còn lại là dữ liệu chuẩn
                  (Faker).
                </p>
                <ul className="list-inside list-disc space-y-1 text-[11px]">
                  <li>
                    <strong className="text-zinc-200">Bỏ trường</strong> — thiếu key trong JSON.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Null</strong> — <code className="text-zinc-300">null</code>.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Giá trị xấu</strong> — theo mẫu bạn chọn (cần % &gt; 0).
                  </li>
                </ul>
              </div>
            </InfoPopover>
          </span>
        </summary>
        <div className="space-y-4 border-t border-zinc-800/50 px-3 pb-4 pt-3">
          <p className="text-xs text-zinc-500">
            Chuẩn (Faker): <span className="font-semibold tabular-nums text-emerald-400/90">{happyPercent}%</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <SliderRow
              label="Bỏ trường"
              value={row.omitPercent}
              onChange={(n) => onChange(applyOmitPercent(row, n))}
            />
            <SliderRow
              label="Null"
              max={100 - row.omitPercent}
              value={row.nullPercent}
              onChange={(n) => onChange(applyNullPercent(row, n))}
            />
            <SliderRow
              label="Giá trị xấu"
              max={100 - row.omitPercent - row.nullPercent}
              value={row.edgePercent}
              onChange={(n) => onChange(applyEdgePercent(row, n))}
            />
          </div>
          <label className="block max-w-md space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs leading-none text-zinc-400">
              Mẫu giá trị xấu
              <InfoPopover label="Mẫu giá trị xấu" panelClassName="w-72">
                <p className="mb-2 text-zinc-400">Chọn kiểu giá trị lỗi khi % giá trị xấu kích hoạt.</p>
                <p className="text-[11px] text-zinc-500">Mô tả từng mẫu hiện dưới dropdown khi % &gt; 0.</p>
              </InfoPopover>
            </span>
            <NativeSelect
              ui="surface"
              value={row.edgePreset}
              onChange={(e) => onChange({ ...row, edgePreset: e.target.value })}
              disabled={row.edgePercent <= 0}
              className="disabled:opacity-40"
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
            </NativeSelect>
            {row.edgePercent > 0 ? (
              <p className="text-[11px] leading-snug text-zinc-500">
                {EDGE_HELP_VI[row.edgePreset] ?? "Giá trị stress cho preset này."}
              </p>
            ) : null}
          </label>
        </div>
      </details>
    </div>
  );
}
