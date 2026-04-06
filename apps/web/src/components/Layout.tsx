import { Outlet, useLocation } from "react-router-dom";
import { AppBar } from "@/components/AppBar";

export function Layout() {
  const { pathname } = useLocation();
  const fullBleedMain = pathname === "/auth";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-300">
      <AppBar />
      <main
        className={
          fullBleedMain
            ? "w-full min-w-0 flex-1"
            : "mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
