import { Database, WifiOff, Zap } from "lucide-react";

const FeatureIconRow = () => {
  return (
    <div className="flex w-16 flex-col items-center justify-center gap-4 border-r border-zinc-800/60 bg-zinc-950/20 py-6">
      <div
        className="flex h-8 w-8 cursor-help items-center justify-center rounded-lg bg-zinc-800/40"
        title="Payload JSON / schema mock — dữ liệu gần thật"
        aria-label="Payload JSON / schema mock — dữ liệu gần thật"
      >
        <Database className="h-4 w-4 text-violet-400" strokeWidth={2} aria-hidden />
      </div>
      <div
        className="flex h-8 w-8 cursor-help items-center justify-center rounded-lg bg-zinc-800/40"
        title="Độ trễ — giả lập API chậm / timeout"
        aria-label="Độ trễ — giả lập API chậm / timeout"
      >
        <Zap className="h-4 w-4 text-amber-200" strokeWidth={2} aria-hidden />
      </div>
      <div
        className="flex h-8 w-8 cursor-help items-center justify-center rounded-lg bg-zinc-800/40"
        title="Lỗi mạng — offline, 5xx, không phản hồi"
        aria-label="Lỗi mạng — offline, 5xx, không phản hồi"
      >
        <WifiOff className="h-4 w-4 text-rose-200" strokeWidth={2} aria-hidden />
      </div>
    </div>
  );
};

export function LandingVisualTool() {
  return (
    <div className="mt-20 w-full relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-rose-500/20 rounded-xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-1000" />
      <div
        className="relative h-[340px] sm:h-[380px] md:h-[420px] bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-2 overflow-auto md:overflow-hidden"
        aria-label="Visual abstraction của mock API"
      >
        <div className="bg-zinc-950/20 h-full min-w-[760px] rounded-lg flex overflow-hidden">
          <FeatureIconRow />

          <div className="flex-1 p-6 font-mono text-base text-zinc-400 leading-relaxed overflow-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-md border border-zinc-800/70 bg-zinc-950/40 px-2 py-0.5 text-base text-violet-300">
                PaperMock
              </span>
              <span className="text-base text-zinc-500">preview</span>
            </div>

            <div className="whitespace-pre-wrap">
              <span className="text-rose-300">GET</span> /api/v1/posts
              {"\n"}
              <span className="text-violet-400">{"{"}</span>
              {"\n"}
              &nbsp;&nbsp;<span className="text-zinc-300">"status"</span>:{" "}
              <span className="text-emerald-300">200</span>,{"\n"}
              &nbsp;&nbsp;<span className="text-zinc-300">"latency"</span>:{" "}
              <span className="text-emerald-300">"450ms"</span>,{"\n"}
              &nbsp;&nbsp;<span className="text-zinc-300">"data"</span>: [{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;{"{"} {"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-zinc-300">"id"</span>:{" "}
              <span className="text-violet-200">"fb_992"</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-zinc-300">"content"</span>:{" "}
              <span className="text-violet-200">"This is a long text mock..."</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-zinc-300">"balance"</span>:{" "}
              <span className="text-zinc-300">-500</span>,{"\n"}
              <span className="inline-block px-2 rounded bg-rose-950/50 text-rose-200">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"// EDGE_CASE: overflow or negative detected"}
              </span>
              {"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;{"}"}{"\n"}
              &nbsp;&nbsp;]
              {"\n"}
              <span className="text-violet-400">{"}"}</span>
            </div>

            <div className="mt-5 flex items-center justify-between text-base text-zinc-500">
              <span>Dữ liệu chuẩn + tô sáng trường hợp lỗi</span>
              <span className="text-violet-300"># dễ nhìn lỗi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

