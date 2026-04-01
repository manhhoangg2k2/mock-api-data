import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "/projects";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      nav(from, { replace: true });
    } catch (e) {
      if (e instanceof ApiError) {
        const b = e.body as { message?: string };
        setErr(b?.message ?? e.message);
      } else setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Đăng nhập</h1>
        <p className="mt-2 text-slate-400 text-sm">Dùng email đã đăng ký.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-surface-border bg-surface-raised p-6">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-400">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-400">Mật khẩu</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </label>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-surface hover:bg-sky-300 disabled:opacity-50"
        >
          {loading ? "…" : "Đăng nhập"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-accent hover:underline">
            Đăng ký
          </Link>
        </p>
      </form>
    </div>
  );
}
