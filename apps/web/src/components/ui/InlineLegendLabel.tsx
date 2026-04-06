import type { ComponentProps } from "react";

export function InlineLegendLabel({
  label,
  hintTitle,
  hintAriaLabel,
  className = "",
}: {
  label: string;
  hintTitle: string;
  hintAriaLabel: string;
  className?: string;
}) {
  return (
    <div className={`flex min-h-5 items-center gap-2 ${className}`.trim()}>
      <span className="font-semibold leading-none text-zinc-300 text-[11px]">{label}</span>
      <span
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/40 text-[10px] font-medium leading-none text-zinc-400"
        title={hintTitle}
        aria-label={hintAriaLabel}
      >
        i
      </span>
    </div>
  );
}

export function InlineFieldRow({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`flex items-center gap-2 ${className}`.trim()} {...props} />;
}
