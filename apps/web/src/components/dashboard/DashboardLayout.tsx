import { Outlet } from "react-router-dom";
import { AppBar } from "@/components/AppBar";
import { dm } from "@/lib/ui/dm-ui";
import { DashboardBreadcrumbs } from "./DashboardBreadcrumbs";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-400 antialiased">
      <AppBar variant="dashboard" />
      <main className={`${dm.container} py-8 pb-10`}>
        <div className="mb-6">
          <DashboardBreadcrumbs />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
