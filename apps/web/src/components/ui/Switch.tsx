import type { ButtonHTMLAttributes } from "react";

export type SwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "role" | "aria-checked" | "onClick" | "children"
> & {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
};

export function Switch({ checked, onCheckedChange, className = "", disabled, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 self-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/35 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-violet-500/45 bg-violet-600" : "border-zinc-700 bg-zinc-800"
      } ${className}`.trim()}
      {...rest}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1 top-1/2 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out motion-reduce:transition-none"
        style={{ transform: checked ? "translate(1.25rem, -50%)" : "translate(0, -50%)" }}
      />
    </button>
  );
}
