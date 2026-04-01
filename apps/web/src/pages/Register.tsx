import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await register(username, email, password);
      nav("/projects", { replace: true });
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
        <h1 className="text-2xl font-semibold text-white">Đăng ký</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Username chỉ gồm chữ thường, số, gạch ngang (3–32 ký tự). Mật khẩu tối thiểu 8 ký tự.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-surface-border bg-surface-raised p-6">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-400">Username</span>
          <input
            required
            minLength={3}
            maxLength={32}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="chữ thường, số, gạch ngang"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-accent font-mono"
          />
        </label>
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
            minLength={8}
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
          {loading ? "…" : "Tạo tài khoản"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
