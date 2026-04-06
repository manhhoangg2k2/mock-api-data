const METHOD_STYLES: Record<string, string> = {
  GET: "border-emerald-500/35 bg-emerald-950/60 text-emerald-300",
  POST: "border-violet-500/35 bg-violet-950/60 text-violet-300",
  PUT: "border-amber-500/35 bg-amber-950/60 text-amber-200",
  PATCH: "border-orange-500/35 bg-orange-950/60 text-orange-200",
  DELETE: "border-rose-500/35 bg-rose-950/60 text-rose-300",
  OPTIONS: "border-zinc-600 bg-zinc-800/80 text-zinc-400",
};

const DEFAULT_STYLE = "border-zinc-600 bg-zinc-800/80 text-zinc-400";

export function EndpointMethodBadges({ methods }: { methods: string[] }) {
  const upper = methods.map((m) => m.toUpperCase());
  return (
    <div className="flex flex-wrap gap-1">
      {upper.map((m) => (
        <span
          key={m}
          className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wide ${METHOD_STYLES[m] ?? DEFAULT_STYLE}`}
        >
          {m}
        </span>
      ))}
    </div>
  );
}
