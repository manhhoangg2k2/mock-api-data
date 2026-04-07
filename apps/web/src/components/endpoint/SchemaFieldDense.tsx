import { useEffect, useState } from "react";
import type { EdgeCatalogGroup, FieldFormRow } from "@/components/endpoint/schema-form";
import {
  applyEdgePercent,
  applyNullPercent,
  applyOmitPercent,
  EDGE_HELP_VI,
  EDGE_LABELS_VI,
  FIELD_TYPES,
  FAKER_LABELS_VI,
  TYPE_LABELS_VI,
} from "@/components/endpoint/schema-form";
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
  variantsTourTarget?: boolean;
  tourExpandVariants?: boolean;
};

const inputSm =
  "h-9 w-full rounded-md border border-zinc-800 bg-zinc-800 px-2 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/25";

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
    <div className="space-y-0.5">
      <div className="flex justify-between gap-2 text-base text-zinc-500">
        <span>{label}</span>
        <span className="tabular-nums text-zinc-400">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(value, max)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-1 w-full accent-violet-500"
        aria-label={label}
      />
    </div>
  );
}

export function SchemaFieldDense({
  row,
  onChange,
  onRemove,
  fakerHints,
  edgePresets,
  edgeCatalog,
  variantsTourTarget = false,
  tourExpandVariants = false,
}: Props) {
  const variantActive = row.omitPercent > 0 || row.nullPercent > 0 || row.edgePercent > 0;
  const happyPercent = Math.max(0, 100 - row.omitPercent - row.nullPercent - row.edgePercent);
  const [variantsOpen, setVariantsOpen] = useState(variantActive);

  useEffect(() => {
    if (variantActive) setVariantsOpen(true);
  }, [variantActive]);
  useEffect(() => {
    if (tourExpandVariants) setVariantsOpen(true);
  }, [tourExpandVariants]);

  const detailsOpen = tourExpandVariants || variantsOpen;

  return (
    <div className="border-b border-zinc-800/90 last:border-b-0">
      <div className="grid grid-cols-1 items-center gap-2 px-2 py-1.5 sm:grid-cols-[minmax(0,1fr)_9.5rem_10.75rem_28px] sm:gap-1.5">
        <input
          value={row.key}
          onChange={(e) => onChange({ ...row, key: e.target.value })}
          placeholder="field_key"
          className={inputSm + " min-w-0 font-mono"}
        />
        <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:contents">
          <div className="min-w-0 w-full sm:w-[9.5rem] sm:justify-self-stretch">
            <NativeSelect
              ui="zinc"
              value={row.type}
              onChange={(e) =>
                onChange({ ...row, type: e.target.value as FieldFormRow["type"], faker: "" })
              }
              className="!min-h-8 !w-full min-w-0 !rounded-md !py-1 !text-base"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS_VI[t] ?? t}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="min-w-0 w-full sm:w-[10.75rem] sm:justify-self-stretch">
            <NativeSelect
              ui="zinc"
              value={row.faker}
              onChange={(e) => onChange({ ...row, faker: e.target.value })}
              className="!min-h-8 !w-full min-w-0 !rounded-md !py-1 !text-base"
            >
              <option value="">Faker…</option>
              {fakerHints.map((h) => (
                <option key={h} value={h}>
                  {FAKER_LABELS_VI[h] ?? h}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center justify-self-start rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 sm:justify-self-center"
          aria-label="Xóa field"
        >
          <IconTrash size={14} />
        </button>
      </div>

      <details
        className={`group/variants border-t border-zinc-800/60 bg-zinc-950/40 ${variantActive ? "open:bg-violet-500/[0.06]" : ""}`}
        data-tour={variantsTourTarget ? "field-variants" : undefined}
        open={detailsOpen}
        onToggle={(e) => {
          if (tourExpandVariants) return;
          setVariantsOpen(e.currentTarget.open);
        }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-1 text-base text-zinc-500 [&::-webkit-details-marker]:hidden">
          <IconZap size={12} className={variantActive ? "text-violet-400" : "text-zinc-600"} />
          <span className="font-medium tracking-wide">Mô phỏng lỗi dữ liệu</span>
          {variantActive ? (
            <span className="rounded bg-violet-500/15 px-1 py-px text-base font-semibold uppercase text-violet-300">
              bật
            </span>
          ) : null}
        </summary>
        <div className="space-y-3 border-l-2 border-violet-500/70 bg-zinc-900/50 px-3 py-2.5 pl-3">
          <div className="flex flex-wrap items-center gap-1 text-base leading-snug text-zinc-500">
            <span>
              Ba nhánh (bỏ trường · null · giá trị xấu) không vượt quá <strong className="text-zinc-400">100%</strong> tổng;
              phần còn lại là dữ liệu chuẩn (Faker).
            </span>
            <InfoPopover label="Tóm tắt" panelClassName="w-64">
              <p className="text-base text-zinc-400">
                Bỏ trường: thiếu key. Null: <span className="text-zinc-200">null</span>. Giá trị xấu: theo mẫu đã chọn.
              </p>
            </InfoPopover>
          </div>
          <p className="rounded border border-zinc-800/80 bg-zinc-950/60 px-2 py-1 text-base text-zinc-400">
            Chuẩn (Faker):{" "}
            <span className="font-semibold tabular-nums text-emerald-400/90">{happyPercent}%</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <SliderRow
              label="Bỏ trường (thiếu key)"
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
          <label className="block space-y-0.5">
            <span className="text-base text-zinc-500">Mẫu giá trị xấu</span>
            <NativeSelect
              ui="zinc"
              value={row.edgePreset}
              onChange={(e) => onChange({ ...row, edgePreset: e.target.value })}
              disabled={row.edgePercent <= 0}
              className="!min-h-8 !text-base disabled:opacity-40"
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
          </label>
          {row.edgePercent > 0 ? (
            <p className="text-base text-zinc-500">{EDGE_HELP_VI[row.edgePreset] ?? ""}</p>
          ) : null}
        </div>
      </details>
    </div>
  );
}
