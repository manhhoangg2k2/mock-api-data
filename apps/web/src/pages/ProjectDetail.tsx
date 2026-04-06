import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FolderGit2 } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { EndpointCreatePanel } from "@/components/endpoint/EndpointCreatePanel";
import { EndpointsTable } from "@/components/dashboard/EndpointsTable";
import { FieldError } from "@/components/ui/field-error";
import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type ProjectRow = { id: string; name: string; slug: string };
type EndpointRow = {
  id: string;
  pathNormalized: string;
  methodsAllowed: string[];
  schemaConfig: unknown;
  latencyMsMin: number | null;
  latencyMsMax: number | null;
};

type EndpointQuotas = { used: number; max: number; remaining: number };

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const createPanelRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointRow[]>([]);
  const [endpointQuotas, setEndpointQuotas] = useState<EndpointQuotas | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [endpointToDeleteId, setEndpointToDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setErr(null);
    try {
      const p = await apiFetch<ProjectRow>(`/v1/projects/${projectId}`);
      setProject(p);
      const eps = await apiFetch<EndpointRow[]>(`/v1/projects/${projectId}/endpoints`);
      setEndpoints(eps);
      try {
        const q = await apiFetch<{ endpoints: EndpointQuotas }>("/v1/me/quotas");
        setEndpointQuotas(q.endpoints);
      } catch {
        setEndpointQuotas(null);
      }
    } catch (e) {
      const m =
        e instanceof ApiError ? String((e.body as { message?: string })?.message ?? e.message) : String(e);
      setErr(m);
      toast.error(m);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function scrollToCreateEndpoint() {
    createPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeEndpoint(id: string) {
    setEndpointToDeleteId(id);
  }

  async function confirmDeleteEndpoint() {
    const id = endpointToDeleteId;
    if (!id) return;
    setEndpointToDeleteId(null);
    setErr(null);
    try {
      await apiFetch(`/v1/endpoints/${id}`, { method: "DELETE" });
      toast.success("Đã xóa endpoint.");
      await load();
    } catch (e) {
      const m =
        e instanceof ApiError ? String((e.body as { message?: string })?.message ?? e.message) : String(e);
      setErr(m);
      toast.error(m);
    }
  }

  const apiOrigin =
    import.meta.env.VITE_API_ORIGIN ||
    (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:3000` : "");

  const publicSlug = user?.publicSlug ?? user?.username ?? "";
  const mockUrlPrefix = `${String(apiOrigin).replace(/\/+$/, "")}/api/${publicSlug}`;

  if (loading) {
    return (
      <AppLoadingScreen layout="compact" message="Đang tải dự án…" />
    );
  }
  if (!project || !projectId) {
    return <FieldError message={err ?? "Không tìm thấy project."} className="text-sm" />;
  }

  const initial = project.name.trim().charAt(0).toUpperCase() || "P";
  const endpointPendingDelete = endpointToDeleteId
    ? endpoints.find((e) => e.id === endpointToDeleteId)
    : undefined;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/projects" className="text-sm text-violet-400/90 hover:underline">
          ← Dự án
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-950 p-6 shadow-xl ring-1 ring-zinc-800/80">
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800/80 text-lg font-bold text-violet-400 shadow-inner">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{project.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  <FolderGit2 size={12} className="opacity-70" aria-hidden />
                  Workspace
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Định danh public:{" "}
                <code className="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-violet-300/90">
                  {project.slug}
                </code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={scrollToCreateEndpoint}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-[0.98] sm:self-start"
          >
            Tạo Endpoint
          </button>
        </div>
      </div>

      {err ? (
        <FieldError
          message={err}
          className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-2 text-sm !text-rose-200"
        />
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">API Endpoints</h2>
          {endpointQuotas ? (
            <p className="text-xs leading-relaxed text-zinc-400">
              Hạn mức toàn tài khoản:{" "}
              <span className="font-semibold tabular-nums text-zinc-200">
                {endpointQuotas.used}/{endpointQuotas.max}
              </span>{" "}
              endpoint
              {endpointQuotas.remaining > 0 ? (
                <>
                  {" "}
                  — còn{" "}
                  <span className="font-semibold tabular-nums text-violet-300/95">{endpointQuotas.remaining}</span>{" "}
                  có thể tạo
                </>
              ) : (
                <span className="text-amber-400/90"> — đã đủ slot (xoá bớt hoặc nâng gói sau này)</span>
              )}
            </p>
          ) : null}
        </div>
        {endpoints.length === 0 ? (
          <p className="text-sm text-zinc-500">Chưa có endpoint. Dùng nút &quot;Tạo Endpoint&quot; phía trên.</p>
        ) : (
          <EndpointsTable
            projectId={projectId}
            rows={endpoints}
            onDelete={removeEndpoint}
            mockUrlPrefix={mockUrlPrefix}
          />
        )}
      </section>

      <div id="create-endpoint" ref={createPanelRef} className="scroll-mt-6">
        <EndpointCreatePanel
          projectId={projectId}
          mockUrlPrefix={mockUrlPrefix}
          onCreated={() => {
            setErr(null);
            void load();
          }}
          onError={setErr}
        />
      </div>

      <ConfirmDialog
        open={endpointToDeleteId !== null}
        title="Xóa endpoint?"
        message={
          endpointPendingDelete
            ? `Endpoint \`${endpointPendingDelete.pathNormalized}\` sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.`
            : "Endpoint này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
        }
        variant="danger"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={() => void confirmDeleteEndpoint()}
        onCancel={() => setEndpointToDeleteId(null)}
      />
    </div>
  );
}
