export function pickStatus(weights: Record<string, number> | null | undefined): number {
  if (!weights || Object.keys(weights).length === 0) return 200;
  const entries = Object.entries(weights).map(([code, w]) => [Number(code), Math.max(0, w)] as const);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  if (sum <= 0) return 200;
  let r = Math.random() * sum;
  for (const [code, w] of entries) {
    r -= w;
    if (r <= 0) return code;
  }
  return entries[entries.length - 1]?.[0] ?? 200;
}
