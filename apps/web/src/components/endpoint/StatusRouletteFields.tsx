import type { Dispatch, SetStateAction } from "react";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { StepperInput } from "@/components/ui/StepperInput";
import { IconDice } from "@/components/ui/icons";
import {
  newRouletteRow,
  ROULETTE_HTTP_PRESETS,
  ROULETTE_PRESET_CODE_SET,
  type StatusRouletteRow,
} from "@/components/endpoint/schema-form";

const CUSTOM_SELECT = "custom";

type Props = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  rows: StatusRouletteRow[];
  setRows: Dispatch<SetStateAction<StatusRouletteRow[]>>;
  comfortable?: boolean;
};

function RouletteToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
        enabled ? "justify-end bg-violet-600" : "justify-start bg-zinc-700"
      }`}
    >
      <span className="h-5 w-5 rounded-full bg-white shadow-sm" aria-hidden />
    </button>
  );
}

function presetMeta(code: number) {
  return ROULETTE_HTTP_PRESETS.find((p) => p.code === code);
}

export function StatusRouletteFields({
  enabled,
  setEnabled,
  rows,
  setRows,
  comfortable = false,
}: Props) {
  return (
    <div className={comfortable ? "rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-4" : "rounded-md border border-zinc-800 bg-zinc-950/50 p-2"}>
      <div className="flex items-center gap-3">
        <RouletteToggle enabled={enabled} onToggle={() => setEnabled(!enabled)} />
        <span className={`flex items-center gap-2 ${comfortable ? "text-sm text-zinc-300" : "text-xs text-zinc-400"}`}>
          <IconDice size={comfortable ? 16 : 14} className="text-zinc-500" aria-hidden />
          Status roulette
        </span>
      </div>
      <p className={`mt-2 ${comfortable ? "text-xs text-zinc-500" : "text-[10px] text-zinc-500"}`}>
        Bật để mỗi lần gọi mock có thể trả mã HTTP khác nhau theo tỷ lệ. Trọng số là tương đối giữa các dòng (không cần tổng 100%).
      </p>

      {enabled ? (
        <div className={comfortable ? "mt-4 space-y-3" : "mt-2 space-y-2"}>
          {comfortable ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRows([newRouletteRow(200, 100)])}
                className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white"
              >
                Chỉ 200
              </button>
              <button
                type="button"
                onClick={() =>
                  setRows([
                    newRouletteRow(200, 92),
                    newRouletteRow(500, 5),
                    newRouletteRow(401, 3),
                  ])
                }
                className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white"
              >
                Gợi ý 200 / 500 / 401
              </button>
              <button
                type="button"
                onClick={() => setRows((r) => [...r, newRouletteRow(500, 100)])}
                className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-violet-400"
              >
                + Dòng
              </button>
            </div>
          ) : rows.length > 0 ? (
            <button
              type="button"
              onClick={() => setRows((r) => [...r, newRouletteRow(500, 100)])}
              className="text-[10px] font-medium text-violet-400 hover:underline"
            >
              + Thêm mã HTTP
            </button>
          ) : null}

          <ul className={comfortable ? "space-y-3" : "space-y-2"}>
            {rows.map((r) => {
              const selectVal = ROULETTE_PRESET_CODE_SET.has(r.code) ? String(r.code) : CUSTOM_SELECT;
              const meta = presetMeta(r.code);

              return (
                <li
                  key={r.clientId}
                  className={
                    comfortable
                      ? "rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3"
                      : "flex flex-col gap-2 rounded-md border border-zinc-800/60 bg-zinc-950/30 p-2 sm:flex-row sm:flex-wrap sm:items-center"
                  }
                >
                  <div className={comfortable ? "space-y-1" : "min-w-0 flex-1"}>
                    <label className={comfortable ? "block text-xs text-zinc-500" : "sr-only"}>
                      Mã trạng thái HTTP
                    </label>
                    <NativeSelect
                      ui="zinc"
                      value={selectVal}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) =>
                          prev.map((x) => {
                            if (x.clientId !== r.clientId) return x;
                            if (v === CUSTOM_SELECT) {
                              const keep = !ROULETTE_PRESET_CODE_SET.has(x.code);
                              return {
                                ...x,
                                code: keep ? x.code : 418,
                              };
                            }
                            return { ...x, code: Number(v) || 200 };
                          })
                        );
                      }}
                      className={
                        comfortable
                          ? "!min-h-10 !text-sm"
                          : "!min-h-8 !rounded-md !py-1 !text-xs"
                      }
                    >
                      {ROULETTE_HTTP_PRESETS.map((p) => (
                        <option key={p.code} value={String(p.code)} title={p.description}>
                          {p.code} — {p.label}: {p.description}
                        </option>
                      ))}
                      <option value={CUSTOM_SELECT}>Khác (nhập mã 100–599)</option>
                    </NativeSelect>
                    {comfortable && meta ? (
                      <p className="text-[11px] leading-snug text-zinc-500">{meta.description}</p>
                    ) : null}
                    {selectVal === CUSTOM_SELECT ? (
                      <div className={comfortable ? "mt-1.5" : "mt-1"}>
                        <StepperInput
                          min={100}
                          max={599}
                          step={1}
                          value={r.code}
                          onChange={(n) =>
                            setRows((prev) =>
                              prev.map((x) => (x.clientId === r.clientId ? { ...x, code: n } : x))
                            )
                          }
                          className={comfortable ? "w-32" : "w-[6.75rem]"}
                          ariaLabel="Mã HTTP tùy chỉnh"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div
                    className={
                      comfortable
                        ? "space-y-1"
                        : "flex min-w-[140px] flex-1 flex-col gap-1 sm:max-w-xs"
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={comfortable ? "text-xs text-zinc-500" : "text-[10px] text-zinc-500"}>
                        Trọng số
                      </span>
                      <span
                        className={`tabular-nums text-zinc-400 ${comfortable ? "text-xs" : "text-[10px]"}`}
                      >
                        {r.weight}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.min(100, Math.max(0, r.weight))}
                      onChange={(e) => {
                        const n = Number(e.target.value) || 0;
                        setRows((prev) =>
                          prev.map((x) =>
                            x.clientId === r.clientId ? { ...x, weight: Math.max(0, Math.min(100, n)) } : x
                          )
                        );
                      }}
                      className="h-1.5 w-full accent-violet-500"
                      aria-label="Trọng số phần trăm"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((x) => x.clientId !== r.clientId))}
                    className={
                      comfortable
                        ? "text-xs text-rose-400 hover:underline"
                        : "shrink-0 text-[10px] text-rose-400 hover:underline sm:self-center"
                    }
                  >
                    {comfortable ? "Xóa dòng" : "×"}
                  </button>
                </li>
              );
            })}
          </ul>

          {rows.length === 0 ? (
            <button
              type="button"
              onClick={() => setRows([newRouletteRow(200, 100)])}
              className={
                comfortable
                  ? "text-xs font-medium text-violet-400 hover:underline"
                  : "text-[10px] font-medium text-violet-400 hover:underline"
              }
            >
              Thêm dòng (mặc định 200 · 100%)
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
