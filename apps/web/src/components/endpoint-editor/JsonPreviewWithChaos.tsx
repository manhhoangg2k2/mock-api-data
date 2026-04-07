import { highlightLineIndicesFromChaos } from "@/lib/json-preview-highlight";

export function JsonPreviewWithChaos({
  body,
  chaos,
  loading,
}: {
  body: unknown;
  chaos: { path: string; kind: string }[];
  loading: boolean;
}) {
  const raw = body === null || body === undefined ? "" : JSON.stringify(body, null, 2);
  const lines = raw ? raw.split("\n") : [];
  const highlightRows =
    chaos.length > 0 && raw ? highlightLineIndicesFromChaos(body, raw, chaos) : new Set<number>();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
      <div className="min-h-[200px] flex-1 overflow-auto p-3">
        {loading ? (
          <p className="font-mono text-base text-zinc-500">Đang sinh preview…</p>
        ) : lines.length === 0 ? (
          <p className="font-mono text-base text-zinc-600">Chưa có dữ liệu.</p>
        ) : (
          <pre className="m-0 font-mono text-base leading-relaxed sm:text-base">
            <code>
              {lines.map((line, i) => {
                const bad = highlightRows.has(i);
                return (
                  <span
                    key={i}
                    className={
                      bad
                        ? "block rounded px-1.5 -mx-1 bg-rose-950/55 text-rose-100"
                        : "block text-zinc-300"
                    }
                  >
                    {line}
                    {i < lines.length - 1 ? "\n" : ""}
                  </span>
                );
              })}
            </code>
          </pre>
        )}
      </div>
    </div>
  );
}
