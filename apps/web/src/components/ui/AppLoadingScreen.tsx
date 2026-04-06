type Layout = "fullscreen" | "embedded" | "compact";

function RingSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-11 w-11 items-center justify-center ${className}`.trim()}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-2xl border border-violet-500/20 bg-zinc-900/60 shadow-inner shadow-violet-500/5" />
      <div
        className="h-6 w-6 rounded-full border-2 border-violet-500/20 border-t-violet-400 motion-safe:animate-spin"
        style={{ animationDuration: "0.85s" }}
      />
    </div>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const ring = size === "sm" ? "h-4 w-4 border" : "h-5 w-5 border-2";
  return (
    <div className={`relative flex ${box} items-center justify-center`} aria-hidden>
      <div
        className={`${ring} rounded-full border-violet-500/25 border-t-violet-400 motion-safe:animate-spin`}
        style={{ animationDuration: "0.8s" }}
      />
    </div>
  );
}

/**
 * Loading UI — zinc/violet, dùng toàn trang bootstrap, vùng lớn, hoặc gọn trong panel.
 */
export function AppLoadingScreen({
  message = "Đang tải…",
  layout = "fullscreen",
  showBrand,
}: {
  message?: string;
  layout?: Layout;
  showBrand?: boolean;
}) {
  const brand = showBrand ?? layout === "fullscreen";

  if (layout === "compact") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-16 motion-safe:animate-app-loader-enter"
        role="status"
        aria-busy="true"
        aria-label={message}
      >
        <LoadingSpinner size="md" />
        <p className="text-center text-sm text-zinc-500">{message}</p>
      </div>
    );
  }

  const height = layout === "fullscreen" ? "min-h-screen" : "min-h-[42vh]";

  return (
    <div
      className={`relative flex w-full ${height} flex-col items-center justify-center overflow-hidden bg-zinc-950 motion-safe:animate-app-loader-enter`}
      role="status"
      aria-busy="true"
      aria-label={message}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-15%,rgba(139,92,246,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(39_39_42/0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgb(39_39_42/0.35)_1px,transparent_1px)] bg-[length:2.75rem_2.75rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_50%,black,transparent)] motion-safe:animate-app-loader-grid-fade"
        aria-hidden
      />
      <div className="relative z-10 flex max-w-sm flex-col items-center gap-7 px-6 text-center">
        <div className="relative">
          <div
            className="absolute -inset-6 rounded-full bg-violet-500/15 blur-2xl motion-safe:animate-app-loader-glow"
            aria-hidden
          />
          <div className="relative rounded-2xl border border-violet-500/25 bg-zinc-900/70 p-3 shadow-xl shadow-black/40 ring-1 ring-violet-500/10 backdrop-blur-sm">
            <RingSpinner />
          </div>
        </div>
        {brand ? (
          <div>
            <p className="text-lg font-bold tracking-tight text-zinc-100">
              Dev<span className="text-violet-500">M</span>ock
            </p>
            <p className="mt-2 text-sm text-zinc-500">{message}</p>
          </div>
        ) : (
          <p className="text-sm font-medium text-zinc-400">{message}</p>
        )}
        <div className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full bg-violet-400/90 motion-safe:animate-app-loader-dot"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton grid cho danh sách project — stagger nhẹ + pulse. */
export function ProjectListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-busy="true"
      aria-label="Đang tải danh sách dự án"
    >
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 motion-safe:animate-app-loader-enter"
          style={{ animationDelay: `${i * 55}ms`, animationFillMode: "backwards" }}
        >
          <div className="motion-safe:animate-pulse space-y-3">
            <div className="h-5 w-3/5 max-w-[12rem] rounded-md bg-zinc-800/90" />
            <div className="h-4 w-2/5 max-w-[8rem] rounded bg-zinc-800/70" />
            <div className="h-10 w-full rounded-md bg-zinc-800/60" />
            <div className="flex gap-4 border-t border-zinc-800/60 pt-4">
              <div className="h-3 w-24 rounded bg-zinc-800/55" />
              <div className="h-3 w-20 rounded bg-zinc-800/55" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
