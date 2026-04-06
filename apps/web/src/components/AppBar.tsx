import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dm } from "@/lib/ui/dm-ui";

function navLinkClass(active: boolean) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
    active ? "bg-zinc-900 text-violet-400" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
  }`;
}

export type AppBarVariant = "public" | "dashboard";

type AppBarProps = {
  variant?: AppBarVariant;
};

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  const handle = user.publicSlug || user.username;
  const initial = handle.slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl shadow-black/40 ring-1 ring-zinc-800/80"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-50"
          >
            <LogOut className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            Đăng xuất
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[14rem] items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 py-1.5 pl-1.5 pr-2 text-left transition hover:border-zinc-700 hover:bg-zinc-800/40 sm:gap-2.5 sm:pr-2.5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/25"
          aria-hidden
        >
          {initial}
        </div>
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-300">@{handle}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
    </div>
  );
}

export function AppBar({ variant = "public" }: AppBarProps) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  const isLandingHome = loc.pathname === "/" && loc.hash !== "#pricing";
  const isPricing = loc.pathname === "/" && loc.hash === "#pricing";

  const onLandingHomeClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (user || loc.pathname !== "/") return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash) navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div
        className={
          dm.container +
          " grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4"
        }
      >
        <div className="flex min-w-0 items-center justify-self-start">
          <Link to="/" className="shrink-0 text-lg font-bold tracking-tight text-zinc-100">
            Dev<span className="text-violet-500">M</span>ock
          </Link>
        </div>

        <nav className="flex max-w-[calc(100vw-2rem)] justify-center justify-self-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-none [&::-webkit-scrollbar]:hidden">
          {variant === "dashboard" ? (
            <NavLink to="/projects" className={({ isActive }) => navLinkClass(isActive)}>
              Projects
            </NavLink>
          ) : (
            <>
              <Link
                to={user ? "/projects" : "/"}
                onClick={onLandingHomeClick}
                className={navLinkClass(user ? loc.pathname.startsWith("/projects") : isLandingHome)}
              >
                Trang chủ
              </Link>
              {!user ? (
                <Link to={{ pathname: "/", hash: "pricing" }} className={navLinkClass(isPricing)}>
                  So sánh tính năng
                </Link>
              ) : null}
              <NavLink to="/docs" className={({ isActive }) => navLinkClass(isActive)}>
                Hướng dẫn
              </NavLink>
              {user ? (
                <NavLink to="/projects" className={({ isActive }) => navLinkClass(isActive)}>
                  Bảng điều khiển
                </NavLink>
              ) : null}
            </>
          )}
        </nav>

        <div className="flex shrink-0 items-center justify-self-end gap-2 sm:gap-3">
          {ready && user ? <UserMenu /> : null}
          {ready && !user ? (
            <>
              <Link to="/login" className={dm.btn.ghost}>
                Đăng nhập
              </Link>
              <Link to="/register" className={dm.btn.primary}>
                Đăng ký
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
