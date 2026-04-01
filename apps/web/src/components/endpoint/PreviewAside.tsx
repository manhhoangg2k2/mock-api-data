import { InfoPopover } from "@/components/ui/InfoPopover";
import {
  IconDice,
  IconEye,
  IconRefresh,
  IconSparkles,
  IconZap,
} from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ChaosItem = { path: string; kind: string };

type Roll = { body: unknown; chaos?: ChaosItem[] };

type Props = {
  paginationEnabled: boolean;
  responseShape: "object" | "array";
  arrayItemCount: number;
  previewLimit: number;
  setPreviewLimit: (n: number) => void;
  previewStressChaos: boolean;
  setPreviewStressChaos: (v: boolean) => void;
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
  previewStressChaos,
  setPreviewStressChaos,
  previewLoading,
  previewErr,
  previewBody,
  previewChaos,
  previewRolls,
  onReroll,
  onMultiRoll,
}: Props) {
  return (
    <aside className="lg:sticky lg:top-6 space-y-6 rounded-2xl border border-surface-border/80 bg-surface-raised/50 p-6 backdrop-blur-sm">
      <SectionHeading
        icon={<IconEye size={20} className="text-sky-400/90" />}
        title="Preview"
        subtitle="Tự làm mới sau khi bạn sửa form."
        info={
          <div className="space-y-2 text-slate-400">
            <p>Gọi POST /v1/preview với schema hiện tại. Paginated dùng limit bạn nhập bên dưới.</p>
            <p>
              <strong className="text-slate-200">Stress chaos</strong> chỉ áp dụng cho preview, không lưu vào
              endpoint.
            </p>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onReroll()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface/80 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:text-white"
        >
          <IconRefresh size={14} />
          Reroll
        </button>
        <button
          type="button"
          onClick={() => onMultiRoll(5)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface/80 px-3 py-1.5 text-xs text-amber-200/90 hover:bg-surface"
        >
          <IconDice size={14} />
          ×5 lần
        </button>
      </div>

      {paginationEnabled && (
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            Limit preview
            <InfoPopover label="Giải thích limit preview" panelClassName="w-64">
              <p className="text-slate-400">
                Số phần tử trong <code className="text-sky-300">data</code> khi gọi preview (giống{" "}
                <code className="text-sky-300">?limit=</code> trên mock thật).
              </p>
            </InfoPopover>
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={previewLimit}
            onChange={(e) =>
              setPreviewLimit(Math.min(100, Math.max(1, Number(e.target.value) || 10)))
            }
            placeholder="10"
            className="w-full max-w-[140px] rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-sm text-white placeholder:text-slate-600"
          />
        </label>
      )}

      {!paginationEnabled && responseShape === "array" && (
        <p className="text-[11px] text-slate-500">
          Đang render <span className="tabular-nums text-slate-400">{arrayItemCount}</span> phần tử.
        </p>
      )}

      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent p-1 hover:border-surface-border/50">
        <input
          type="checkbox"
          checked={previewStressChaos}
          onChange={(e) => setPreviewStressChaos(e.target.checked)}
          className="mt-0.5 rounded border-surface-border"
        />
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-slate-400">
          <IconZap size={14} className="shrink-0 text-amber-400/80" />
          <span className="text-slate-300">Stress chaos</span>
          <InfoPopover label="Stress chaos là gì?" panelClassName="w-64">
            <p>
              Tăng tối thiểu % omit/null/edge trong preview để bạn dễ bắt gặp giá trị lỗi. Schema đã lưu không đổi.
            </p>
          </InfoPopover>
        </span>
      </label>

      {previewLoading && (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <IconSparkles size={14} className="animate-pulse text-accent" />
          Đang tạo…
        </p>
      )}
      {previewErr && <p className="text-xs text-red-400">{previewErr}</p>}

      {previewRolls && previewRolls.length > 0 ? (
        <div className="space-y-2 max-h-[min(70vh,560px)] overflow-auto">
          {previewRolls.map((roll, i) => (
            <details
              key={i}
              className="rounded-xl border border-surface-border/60 bg-surface/60"
              open={i === 0}
            >
              <summary className="cursor-pointer px-3 py-2.5 text-xs text-slate-400">
                #{i + 1}
                {roll.chaos?.length ? (
                  <span className="ml-2 text-amber-200/70">· {roll.chaos.length} chaos</span>
                ) : null}
              </summary>
              <pre className="max-h-48 overflow-auto border-t border-surface-border/50 p-3 text-[11px] text-slate-300 whitespace-pre-wrap break-all">
                {JSON.stringify(roll.body, null, 2)}
              </pre>
              {roll.chaos && roll.chaos.length > 0 && (
                <ul className="space-y-0.5 px-3 pb-2 font-mono text-[10px] text-slate-500">
                  {roll.chaos.map((c, j) => (
                    <li key={j}>
                      {c.path} → {c.kind}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>
      ) : (
        <>
          {previewChaos.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-amber-200/80">
                Chaos
              </p>
              <ul className="space-y-0.5 font-mono text-[11px] text-slate-500">
                {previewChaos.map((c, i) => (
                  <li key={`${c.path}-${i}`}>
                    {c.path} → <span className="text-amber-200/70">{c.kind}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <pre className="max-h-[min(70vh,520px)] overflow-auto rounded-xl border border-surface-border/40 bg-surface/40 p-4 text-[11px] text-slate-300 whitespace-pre-wrap break-all">
            {previewBody === null && !previewLoading && !previewErr
              ? "Chờ dữ liệu form…"
              : JSON.stringify(previewBody, null, 2)}
          </pre>
        </>
      )}
    </aside>
  );
}
