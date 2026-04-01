import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export function Projects() {
  const { user } = useAuth();
  const [list, setList] = useState<ProjectRow[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const rows = await apiFetch<ProjectRow[]>("/v1/projects");
      setList(rows);
    } catch (e) {
      if (e instanceof ApiError) setErr(String((e.body as { message?: string })?.message ?? e.message));
      else setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await apiFetch("/v1/projects", { method: "POST", json: { name, slug } });
      setName("");
      setSlug("");
      await load();
    } catch (e) {
      if (e instanceof ApiError) setErr(String((e.body as { message?: string })?.message ?? e.message));
      else setErr(String(e));
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">Projects</h1>
        <p className="mt-2 text-slate-400 text-sm">
          User <span className="font-mono text-accent">{user?.username}</span> — mock public:{" "}
          <code className="text-slate-500">
            /api/{user?.username}/&lt;path&gt;
          </code>
          . Free tier: tối đa 2 project, 5 endpoint.
        </p>
      </div>

      <form
        onSubmit={create}
        className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface-raised p-6 sm:flex-row sm:items-end"
      >
        <label className="flex-1 space-y-1">
          <span className="text-xs text-slate-400">Tên</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </label>
        <label className="flex-1 space-y-1">
          <span className="text-xs text-slate-400">Slug</span>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-sky-300"
        >
          Tạo project
        </button>
      </form>

      {err && <p className="text-sm text-red-400">{err}</p>}

      {loading ? (
        <p className="text-slate-500 text-sm">Đang tải…</p>
      ) : list.length === 0 ? (
        <p className="text-slate-500 text-sm">Chưa có project.</p>
      ) : (
        <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-raised">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                to={`/projects/${p.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-border/20"
              >
                <div>
                  <p className="font-medium text-white">{p.name}</p>
                  <p className="font-mono text-xs text-slate-500">{p.slug}</p>
                </div>
                <span className="text-slate-500 text-sm">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
