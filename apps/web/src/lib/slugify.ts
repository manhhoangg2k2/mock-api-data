const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

export function slugifyProjectName(raw: string): string {
  let s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (s.length < 3) s = `${s}app`.replace(/[^a-z0-9-]/g, "").slice(0, 32) || "app";
  if (!/^[a-z0-9]/.test(s)) s = `p-${s}`.replace(/[^a-z0-9-]/g, "-");
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  if (!SLUG_RE.test(s)) return "project";
  return s;
}

export function withSlugSuffix(slug: string, suffix: string): string {
  const clean = suffix.replace(/[^a-z0-9]/g, "").slice(0, 8) || "x";
  let combined = `${slug}-${clean}`.replace(/-+/g, "-").slice(0, 32).replace(/-+$/g, "");
  if (SLUG_RE.test(combined)) return combined;
  combined = `prj-${clean}`.slice(0, 32).replace(/-+$/g, "");
  if (SLUG_RE.test(combined)) return combined;
  return "project";
}
