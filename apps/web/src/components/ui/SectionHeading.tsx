import type { ReactNode } from "react";
import { InfoPopover } from "./InfoPopover";

type Props = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  info?: ReactNode;
  className?: string;
};

export function SectionHeading({ icon, title, subtitle, info, className = "" }: Props) {
  return (
    <div className={`mb-5 flex items-start justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400">
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-medium tracking-tight text-zinc-100">{title}</h3>
          {subtitle ? <p className="mt-1 max-w-xl text-[11px] leading-snug text-zinc-500">{subtitle}</p> : null}
        </div>
      </div>
      {info ? <InfoPopover label={`Chi tiết: ${title}`}>{info}</InfoPopover> : null}
    </div>
  );
}
