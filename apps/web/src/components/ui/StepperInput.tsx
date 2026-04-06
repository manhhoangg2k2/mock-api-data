import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

const btnBase =
  "flex shrink-0 items-center justify-center border-zinc-700 bg-zinc-900 text-zinc-400 outline-none transition hover:bg-zinc-800 hover:text-zinc-100 focus-visible:ring-1 focus-visible:ring-violet-500/50 disabled:pointer-events-none disabled:opacity-35";

const inputBase =
  "min-w-0 flex-1 border-x border-zinc-700 bg-zinc-800 py-0 text-center text-xs text-zinc-100 outline-none focus:z-[1] focus:border-violet-500/50 focus:ring-1 focus:ring-inset focus:ring-violet-500/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function StepperInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  className = "",
  ariaLabel,
}: Props) {
  const dec = () => {
    if (disabled) return;
    onChange(Math.max(min, value - step));
  };
  const inc = () => {
    if (disabled) return;
    onChange(Math.min(max, value + step));
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex h-8 max-w-full items-stretch overflow-hidden rounded-md border border-zinc-800 bg-zinc-800 ${className}`.trim()}
    >
      <button
        type="button"
        aria-label="Giảm"
        disabled={disabled || value <= min}
        onClick={dec}
        className={`${btnBase} w-7 border-r`}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        step="any"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "" || raw === "-") return;
          const n = Number(raw);
          if (!Number.isFinite(n)) return;
          onChange(Math.min(max, Math.max(min, Math.trunc(n))));
        }}
        className={inputBase}
      />
      <button
        type="button"
        aria-label="Tăng"
        disabled={disabled || value >= max}
        onClick={inc}
        className={`${btnBase} w-7 border-l`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
