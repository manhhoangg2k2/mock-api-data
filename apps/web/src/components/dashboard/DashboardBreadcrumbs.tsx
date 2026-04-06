import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

type Item = { label: string; to?: string };

export function DashboardBreadcrumbs() {
  const { pathname } = useLocation();
  const { projectId, endpointId } = useParams();

  const items: Item[] = [];

  if (pathname === "/projects") {
    items.push({ label: "Projects" });
  } else if (pathname.startsWith("/projects/") && projectId) {
    items.push({ label: "Projects", to: "/projects" });
    if (pathname.includes("/endpoints/") && endpointId) {
      items.push({ label: "Project", to: `/projects/${projectId}` });
      items.push({ label: "Endpoint editor" });
    } else {
      items.push({ label: "Chi tiết project" });
    }
  } else if (pathname.startsWith("/builder")) {
    items.push({ label: "Schema Builder" });
  } else if (pathname.startsWith("/settings")) {
    items.push({ label: "Settings" });
  } else if (pathname.startsWith("/usage")) {
    items.push({ label: "Usage & Billing" });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
      <Link
        to="/projects"
        className="inline-flex items-center text-zinc-400 transition-colors hover:text-zinc-50"
        title="Projects"
      >
        <Home className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">Projects home</span>
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
            {item.to && !isLast ? (
              <Link to={item.to} className="text-zinc-400 transition-colors hover:text-zinc-50">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-zinc-50" : "text-zinc-400"}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
