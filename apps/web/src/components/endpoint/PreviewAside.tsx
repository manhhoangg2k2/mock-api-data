import { RefreshCw } from "lucide-react";
import { InfoPopover } from "@/components/ui/InfoPopover";
import { StepperInput } from "@/components/ui/StepperInput";
import { JsonPreviewWithChaos } from "@/components/endpoint-editor/JsonPreviewWithChaos";
import { FieldError } from "@/components/ui/field-error";

type ChaosItem = { path: string; kind: string };

type Roll = { body: unknown; chaos?: ChaosItem[] };

type Props = {
  paginationEnabled: boolean;
  responseShape: "object" | "array";
  arrayItemCount: number;
  previewLimit: number;
  setPreviewLimit: (n: number) => void;
  previewLoading: boolean;
  previewErr: string | null;
  previewBody: unknown;
  previewChaos: ChaosItem[];
  previewRolls: Roll[] | null;
  onReroll: () => void;
  onMultiRoll: (n: number) => void;
};

export function PreviewAside({
  paginationEnabled,
  responseShape,
  arrayItemCount,
  previewLimit,
  setPreviewLimit,
  previewLoading,
  previewErr,
  previewBody,
  previewChaos,
  previewRolls,
  onReroll,
  onMultiRoll,
}: Props) {
  return (
    <aside
      data-tour="preview-panel"
      className="sticky top-0 z-10 flex max-h-[calc(100dvh-8rem)] min-h-[420px] flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-950"
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Live preview</h2>
          <p className="text-[10px] text-zinc-500">POST /v1/preview</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onMultiRoll(5)}
            className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-[10px] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
            title="5 lần"
          >
            ×5
          </button>
          <button
            type="button"
            onClick={() => onReroll()}
            className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:border-violet-500/50 hover:text-violet-300"
            title="Reroll"
          >
            <RefreshCw size={12} className={previewLoading ? "animate-spin" : ""} aria-hidden />
            Reroll
          </button>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-b border-zinc-800 px-3 py-2">
        {paginationEnabled ? (
          <label className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
            <span className="shrink-0">Limit</span>
            <StepperInput
              min={1}
              max={100}
              step={1}
              value={previewLimit}
              onChange={(n) => setPreviewLimit(n)}
              className="w-[7rem]"
            />
            <InfoPopover label="Limit" panelClassName="w-56">
              <p className="text-xs text-zinc-400">Giống ?limit trên mock paginated.</p>
            </InfoPopover>
          </label>
        ) : null}
        {!paginationEnabled && responseShape === "array" ? (
          <p className="text-[10px] text-zinc-500">
            <span className="tabular-nums text-zinc-400">{arrayItemCount}</span> phần tử / lần sinh
          </p>
        ) : null}
        <FieldError message={previewErr} size="compact" variant="panel" />
      </div>

      {previewRolls && previewRolls.length > 0 ? (
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {previewRolls.map((roll, i) => (
            <details key={i} className="rounded border border-zinc-800 bg-zinc-900/40" open={i === 0}>
              <summary className="cursor-pointer px-2 py-1 text-[10px] text-zinc-500">
                #{i + 1}
                {roll.chaos?.length ? (
                  <span className="ml-1 text-amber-200/75">· {roll.chaos.length} ô lệch</span>
                ) : null}
              </summary>
              <div className="border-t border-zinc-800 p-2">
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-zinc-300">
                  {JSON.stringify(roll.body, null, 2)}
                </pre>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <JsonPreviewWithChaos body={previewBody} chaos={previewChaos} loading={previewLoading} />
        </div>
      )}
    </aside>
  );
}
