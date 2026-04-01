import type { ReactNode } from "react";
import { InfoPopover } from "./InfoPopover";

type Props = {
  icon: ReactNode;
  title: string;
  /** Một dòng ngắn dưới tiêu đề (tùy chọn) */
  subtitle?: string;
  /** Nội dung trong popover khi cần chi tiết */
  info?: ReactNode;
  className?: string;
};

export function SectionHeading({ icon, title, subtitle, info, className = "" }: Props) {
  return (
    <div className={`mb-5 flex items-start justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border/60 bg-surface/80 text-slate-400">
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-medium tracking-tight text-slate-100">{title}</h3>
          {subtitle ? <p className="mt-1 max-w-xl text-[11px] leading-snug text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {info ? <InfoPopover label={`Chi tiết: ${title}`}>{info}</InfoPopover> : null}
    </div>
  );
}
