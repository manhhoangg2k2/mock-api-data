import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IconHelpCircle } from "./icons";

type Props = {
  children: ReactNode;
  label?: string;
  panelClassName?: string;
};

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
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-800/50 hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
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
          className={`absolute left-0 top-full z-50 mt-1.5 ${panelClassName} rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-left text-base leading-relaxed text-zinc-300 shadow-xl`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
