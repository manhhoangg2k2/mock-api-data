import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Calendar, Radio } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { NewProjectDialog } from "@/components/dashboard/NewProjectDialog";
import { FieldError } from "@/components/ui/field-error";
import { ProjectListSkeleton } from "@/components/ui/AppLoadingScreen";
import { slugifyProjectName, withSlugSuffix } from "@/lib/slugify";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

function ProjectCard({
  to,
  name,
  slug,
  description,
  endpointLabel,
  dateLabel,
  dateIso,
}: {
  to: string;
  name: string;
  slug: string;
  description?: string;
  endpointLabel: string;
  dateLabel: string;
  dateIso: string;
}) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/[0.07]"
    >
      <div className="min-h-0 flex-1">
        <h2 className="text-lg font-semibold text-zinc-50 transition-colors group-hover:text-violet-300">{name}</h2>
        <p className="mt-1.5 truncate font-mono text-sm text-zinc-500">{slug}</p>
        {description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-snug text-zinc-500">{description}</p>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-800/80 pt-4 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          <span>{endpointLabel}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          <time dateTime={dateIso}>{dateLabel}</time>
        </span>
      </div>
    </Link>
  );
}

export function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const [list, setList] = useState<ProjectRow[]>([]);
  const [endpointCounts, setEndpointCounts] = useState<Record<string, number>>({});
  const [descriptionById, setDescriptionById] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const publicSlug = user?.publicSlug ?? user?.username ?? "";

  const load = useCallback(async () => {
    setErr(null);
    try {
      const rows = await apiFetch<ProjectRow[]>("/v1/projects");
      setList(rows);
    } catch (e) {
      const m =
        e instanceof ApiError ? String((e.body as { message?: string })?.message ?? e.message) : String(e);
      setErr(m);
      toast.error(m);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!list.length) {
      setEndpointCounts({});
      return;
    }
    let cancelled = false;
    void Promise.all(
      list.map(async (p) => {
        try {
          const eps = await apiFetch<unknown[]>(`/v1/projects/${p.id}/endpoints`);
          return [p.id, Array.isArray(eps) ? eps.length : 0] as const;
        } catch {
          return [p.id, 0] as const;
        }
      })
    ).then((pairs) => {
      if (!cancelled) setEndpointCounts(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [list]);

  async function createFromDialog(payload: { name: string; description: string }) {
    setErr(null);
    let slug = slugifyProjectName(payload.name);
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const row = await apiFetch<ProjectRow>("/v1/projects", {
          method: "POST",
          json: { name: payload.name, slug },
        });
        if (payload.description) {
          setDescriptionById((prev) => ({ ...prev, [row.id]: payload.description }));
        }
        toast.success("Đã tạo project.");
        await load();
        return;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409 && attempt < maxAttempts - 1) {
          const noise = Math.random().toString(36).slice(2, 6);
          slug = withSlugSuffix(slugifyProjectName(payload.name), noise);
          continue;
        }
        const m =
          e instanceof ApiError ? String((e.body as { message?: string })?.message ?? e.message) : String(e);
        setErr(m);
        toast.error(m);
        throw e;
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">My Projects</h1>
          <div className="max-w-2xl space-y-1.5 text-sm leading-relaxed text-zinc-400">
            <p>
              <span className="font-mono text-zinc-300">@{user?.username ?? "—"}</span>
              {" · "}mock công khai{" "}
              <code className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-px font-mono text-[0.8125rem] text-zinc-300">
                /api/{publicSlug || "…"}/…
              </code>
            </p>
            <p className="text-zinc-500">
              Free tier: tối đa 2 project, 5 endpoint mỗi project.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-600 active:scale-[0.98]"
        >
          + New Project
        </button>
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={createFromDialog} />

      {err && !loading ? (
        <FieldError
          message={err}
          className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-2 text-sm !text-rose-200"
        />
      ) : null}

      {loading ? (
        <ProjectListSkeleton count={6} />
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 px-6 py-16 text-center">
          <Box className="mx-auto h-10 w-10 text-zinc-600" aria-hidden />
          <p className="mt-3 text-sm font-medium text-zinc-400">Chưa có project</p>
          <p className="mt-1 text-xs text-zinc-500">Bấm &quot;+ New Project&quot; để tạo dự án đầu tiên.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const n = endpointCounts[p.id];
            const countLabel = n === undefined ? "…" : String(n);
            const desc = descriptionById[p.id];
            const endpointText = countLabel === "…" ? "… endpoints" : `${countLabel} endpoints`;
            const d = new Date(p.createdAt);
            const dateLabel = d.toLocaleDateString("vi-VN");

            return (
              <li key={p.id}>
                <ProjectCard
                  to={`/projects/${p.id}`}
                  name={p.name}
                  slug={p.slug}
                  description={desc}
                  endpointLabel={endpointText}
                  dateLabel={dateLabel}
                  dateIso={p.createdAt}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
