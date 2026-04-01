import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IconHelpCircle } from "./icons";

type Props = {
  /** Nội dung popover (đoạn hướng dẫn) */
  children: ReactNode;
  /** aria-label cho nút */
  label?: string;
  /** Kích thước panel */
  panelClassName?: string;
};

/**
 * Nút ? / i — click để mở popover; click ngoài hoặc Escape để đóng.
 */
export function InfoPopover({ children, label = "Thông tin thêm", panelClassName = "w-72" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnId = useId();
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-flex align-middle" ref={rootRef}>
      <button
        id={btnId}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <IconHelpCircle size={16} />
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={btnId}
          className={`absolute left-0 top-full z-50 mt-1.5 ${panelClassName} rounded-xl border border-surface-border bg-surface-raised p-3 text-left text-xs leading-relaxed text-slate-300 shadow-xl`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
