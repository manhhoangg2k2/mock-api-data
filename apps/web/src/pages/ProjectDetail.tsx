import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { EndpointCreatePanel } from "@/components/endpoint/EndpointCreatePanel";

type ProjectRow = { id: string; name: string; slug: string };
type EndpointRow = {
  id: string;
  pathNormalized: string;
  methodsAllowed: string[];
  latencyMsMin: number | null;
  latencyMsMax: number | null;
};

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    setErr(null);
    try {
      const p = await apiFetch<ProjectRow>(`/v1/projects/${projectId}`);
      setProject(p);
      const eps = await apiFetch<EndpointRow[]>(`/v1/projects/${projectId}/endpoints`);
      setEndpoints(eps);
    } catch (e) {
      if (e instanceof ApiError) setErr(String((e.body as { message?: string })?.message ?? e.message));
      else setErr(String(e));
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeEndpoint(id: string) {
    if (!confirm("Xóa endpoint này?")) return;
    setErr(null);
    try {
      await apiFetch(`/v1/endpoints/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      if (e instanceof ApiError) setErr(String((e.body as { message?: string })?.message ?? e.message));
      else setErr(String(e));
    }
  }

  const apiOrigin =
    import.meta.env.VITE_API_ORIGIN ||
    (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:3000` : "");

  if (loading) return <p className="text-slate-500 text-sm">Đang tải…</p>;
  if (!project || !projectId) return <p className="text-red-400 text-sm">{err ?? "Không tìm thấy project."}</p>;

  return (
    <div className="space-y-10">
      <div>
        <Link to="/projects" className="text-sm text-accent hover:underline">
          ← Projects
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">{project.name}</h1>
        <p className="mt-1 font-mono text-sm text-slate-500">{project.slug}</p>
        <p className="mt-4 text-sm text-slate-400">
          Mock URL mẫu (khi đã tạo path <code className="text-slate-500">v1/items</code>):{" "}
          <code className="block mt-2 break-all rounded-lg bg-surface-raised p-2 text-xs text-accent">
            {apiOrigin}/api/{user?.username}/v1/items
          </code>
        </p>
      </div>

      {err && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-300">{err}</p>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-slate-200">Endpoints</h2>
        {endpoints.length === 0 ? (
          <p className="text-slate-500 text-sm">Chưa có endpoint.</p>
        ) : (
          <ul className="space-y-2">
            {endpoints.map((ep) => (
              <li
                key={ep.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-border bg-surface-raised px-4 py-3"
              >
                <div>
                  <code className="text-sm text-accent">{ep.pathNormalized}</code>
                  <span className="ml-2 text-xs text-slate-500">{ep.methodsAllowed.join(", ")}</span>
                  {(ep.latencyMsMin ?? 0) > 0 || (ep.latencyMsMax ?? 0) > 0 ? (
                    <span className="ml-2 text-xs text-slate-600">
                      ⏱ {ep.latencyMsMin ?? 0}–{ep.latencyMsMax ?? 0} ms
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeEndpoint(ep.id)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EndpointCreatePanel
        projectId={projectId}
        onCreated={() => {
          setErr(null);
          void load();
        }}
        onError={setErr}
      />
    </div>
  );
}
