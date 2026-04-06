import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Pencil, Trash2 } from "lucide-react";
import { EndpointMethodBadges } from "./EndpointMethodBadges";
import { chaosSimulationSummaryVi, estimateChaosPeakPercent } from "@/lib/endpoint-chaos";
import { useToast } from "@/context/ToastContext";

export type EndpointTableRow = {
  id: string;
  pathNormalized: string;
  methodsAllowed: string[];
  schemaConfig: unknown;
  latencyMsMin: number | null;
  latencyMsMax: number | null;
};

type Props = {
  projectId: string;
  rows: EndpointTableRow[];
  onDelete: (id: string) => void;
  mockUrlPrefix: string;
};

function normalizePathForUrl(pathNormalized: string): string {
  return pathNormalized.replace(/^\/+/, "");
}

export function EndpointsTable({ projectId, rows, onDelete, mockUrlPrefix }: Props) {
  const toast = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyFullUrl(pathNormalized: string, id: string) {
    const path = normalizePathForUrl(pathNormalized);
    const base = mockUrlPrefix.replace(/\/+$/, "");
    const full = `${base}/${path}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopiedId(id);
      toast.success("Đã copy URL mock đầy đủ.");
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      toast.error("Không copy được — thử chọn URL và copy thủ công.");
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Method</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Path</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Mô phỏng lỗi
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((ep) => {
              const chaosPct = estimateChaosPeakPercent(ep.schemaConfig);
              const chaosVi = chaosSimulationSummaryVi(chaosPct);
              const fullPreview = `${mockUrlPrefix.replace(/\/+$/, "")}/${normalizePathForUrl(ep.pathNormalized)}`;
              return (
                <tr key={ep.id} className="transition-colors hover:bg-zinc-800/30">
                  <td className="px-4 py-3 align-middle">
                    <EndpointMethodBadges methods={ep.methodsAllowed} />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-[0.8125rem] text-violet-300/95">/{ep.pathNormalized}</code>
                      <button
                        type="button"
                        onClick={() => void copyFullUrl(ep.pathNormalized, ep.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950/80 px-2 py-1 text-[10px] font-medium text-zinc-400 transition hover:border-violet-500/45 hover:text-violet-300"
                        title={fullPreview}
                        aria-label="Copy URL mock đầy đủ"
                      >
                        {copiedId === ep.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                        ) : (
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Copy URL
                      </button>
                    </div>
                    {(ep.latencyMsMin ?? 0) > 0 || (ep.latencyMsMax ?? 0) > 0 ? (
                      <p className="mt-1 text-[0.65rem] text-zinc-600">
                        Độ trễ: {ep.latencyMsMin ?? 0}–{ep.latencyMsMax ?? 0} ms
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-[200px] px-4 py-3 align-middle">
                    {chaosPct > 0 ? (
                      <span
                        className="inline-flex rounded-md border border-amber-500/30 bg-amber-950/35 px-2 py-1.5 text-xs font-medium leading-snug text-amber-200/95"
                        title={chaosVi.detail}
                      >
                        {chaosVi.line}
                      </span>
                    ) : (
                      <span
                        className="inline-flex rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-xs leading-snug text-zinc-400"
                        title={chaosVi.detail}
                      >
                        {chaosVi.line}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/projects/${projectId}/endpoints/${ep.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-violet-500/50 hover:text-violet-300"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Sửa
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(ep.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-rose-500/40 hover:bg-rose-950/30 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
