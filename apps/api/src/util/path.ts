/** Normalize path for DB lookup: trim slashes, no leading slash. */
export function normalizeResourcePath(raw: string | undefined): string {
  if (!raw) return "";
  return raw.replace(/^\/+|\/+$/g, "");
}
