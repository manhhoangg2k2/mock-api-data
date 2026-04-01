import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl, fetchHealth, fetchMockDemo } from "@/lib/api";

export function Home() {
  const [health, setHealth] = useState<string>("—");
  const [mockPreview, setMockPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const originLabel = import.meta.env.VITE_API_ORIGIN || "(proxy → localhost:3000)";

  const ping = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const h = await fetchHealth();
      setHealth(h.ok ? "OK" : JSON.stringify(h));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setHealth("lỗi");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMock = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const j = await fetchMockDemo(2);
      setMockPreview(JSON.stringify(j, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setMockPreview("");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">Tổng quan</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Frontend cho DevMock. API base: <code className="font-mono text-sm text-accent">{originLabel}</code>
        </p>
        <p className="mt-3 text-sm text-slate-500">
          <Link to="/register" className="text-accent hover:underline">
            Đăng ký
          </Link>{" "}
          để tạo project & endpoint; mock public tại{" "}
          <code className="font-mono text-slate-500">/api/&lt;username&gt;/…</code>
        </p>
      </div>

      <section className="rounded-xl border border-surface-border bg-surface-raised p-6 space-y-4">
        <h2 className="text-lg font-medium text-slate-100">Kiểm tra API</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={ping}
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-sky-300 disabled:opacity-50"
          >
            Ping /health
          </button>
          <button
            type="button"
            onClick={loadMock}
            disabled={loading}
            className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-slate-200 hover:bg-surface-border/40 disabled:opacity-50"
          >
            Gọi mock demo
          </button>
        </div>
        <p className="text-sm text-slate-500">
          URL thử: <code className="font-mono text-slate-400">{apiUrl("/health")}</code>
        </p>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Health</dt>
            <dd className="font-mono text-accent">{health}</dd>
          </div>
        </dl>
      </section>

      {mockPreview ? (
        <section className="rounded-xl border border-surface-border bg-surface-raised overflow-hidden">
          <div className="border-b border-surface-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Preview /api/demo/v1/users
          </div>
          <pre className="max-h-[420px] overflow-auto p-4 font-mono text-xs text-slate-300">{mockPreview}</pre>
        </section>
      ) : null}
    </div>
  );
}
