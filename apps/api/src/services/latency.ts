export async function applyLatency(minMs: number | null | undefined, maxMs: number | null | undefined) {
  const lo = Math.max(0, minMs ?? 0);
  const hi = Math.max(lo, maxMs ?? lo);
  const ms = lo === hi ? lo : Math.floor(lo + Math.random() * (hi - lo + 1));
  if (ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}
