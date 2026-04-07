import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastOptions = {
  duration?: number;
  id?: string;
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4200,
  error: 7000,
  warning: 5500,
  info: 4500,
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const common = "h-5 w-5 shrink-0";
  if (variant === "success") {
    return (
      <svg className={common + " text-emerald-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg className={common + " text-rose-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  if (variant === "warning") {
    return (
      <svg className={common + " text-amber-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    );
  }
  return (
    <svg className={common + " text-violet-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function toastSurface(variant: ToastVariant): string {
  switch (variant) {
    case "success":
      return "border-emerald-500/25 bg-emerald-950/90 text-emerald-50 shadow-lg shadow-emerald-950/40";
    case "error":
      return "border-rose-500/30 bg-rose-950/90 text-rose-50 shadow-lg shadow-rose-950/40";
    case "warning":
      return "border-amber-500/30 bg-amber-950/90 text-amber-50 shadow-lg shadow-amber-950/40";
    default:
      return "border-violet-500/25 bg-zinc-900/95 text-zinc-100 shadow-lg shadow-black/50";
  }
}

type ToastApi = {
  show: (message: string, variant: ToastVariant, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t != null) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((x) => x.id !== id));
    },
    [clearTimer]
  );

  const show = useCallback(
    (message: string, variant: ToastVariant, options?: ToastOptions) => {
      const id = options?.id ?? newId();
      const duration = options?.duration ?? DEFAULT_DURATION[variant];

      setToasts((prev) => {
        if (prev.some((t) => t.id === id)) return prev;
        return [...prev, { id, message, variant }];
      });

      clearTimer(id);
      if (duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => {
            timers.current.delete(id);
            setToasts((prev) => prev.filter((x) => x.id !== id));
          }, duration)
        );
      }
      return id;
    },
    [clearTimer]
  );

  const value = useMemo<ToastApi>(
    () => ({
      show,
      success: (m, o) => show(m, "success", o),
      error: (m, o) => show(m, "error", o),
      warning: (m, o) => show(m, "warning", o),
      info: (m, o) => show(m, "info", o),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[300] flex max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),22rem)] flex-col gap-2 overflow-y-auto pr-0.5"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Thông báo"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex gap-3 rounded-xl border px-3.5 py-3 text-base font-medium leading-snug ${toastSurface(t.variant)}`}
          >
            <ToastIcon variant={t.variant} />
            <p className="min-w-0 flex-1 pt-0.5">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Đóng thông báo"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast outside ToastProvider");
  return v;
}
