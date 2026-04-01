import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-surface-raised text-accent" : "text-slate-400 hover:bg-surface-raised hover:text-slate-200"
  }`;

export function Layout() {
  const { user, logout, ready } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-surface-border bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="font-semibold text-slate-100 tracking-tight">
            DevMock
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Tổng quan
            </NavLink>
            {user ? (
              <>
                <NavLink to="/projects" className={linkClass}>
                  Projects
                </NavLink>
                <NavLink to="/builder" className={linkClass}>
                  Builder
                </NavLink>
              </>
            ) : null}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {ready && user ? (
              <>
                <span className="text-slate-500 font-mono max-w-[140px] truncate">{user.username}</span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-slate-400 hover:text-white"
                >
                  Đăng xuất
                </button>
              </>
            ) : ready ? (
              <>
                <Link to="/login" className="text-slate-400 hover:text-white">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-accent px-3 py-1.5 text-surface font-medium hover:bg-sky-300"
                >
                  Đăng ký
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
