import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

const SAMPLE = `{
  "responseShape": "object",
  "fields": [
    { "key": "email", "type": "string", "faker": "email", "chaos": { "nullPercent": 10, "edgePercent": 5, "edgePreset": "email_bad" } }
  ],
  "virtualPagination": { "enabled": true, "totalCount": 1000000 }
}`;

export function Builder() {
  const [schemaJson, setSchemaJson] = useState(SAMPLE);
  const [queryStr, setQueryStr] = useState("limit=3&page=1");
  const [out, setOut] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reroll() {
    setErr(null);
    setLoading(true);
    let schemaConfig: unknown;
    try {
      schemaConfig = JSON.parse(schemaJson) as unknown;
    } catch {
      setErr("JSON schema không hợp lệ.");
      setLoading(false);
      return;
    }
    const query: Record<string, string> = {};
    for (const part of queryStr.split("&")) {
      const [k, v] = part.split("=");
      if (k) query[decodeURIComponent(k)] = v != null ? decodeURIComponent(v) : "";
    }
    try {
      const res = await apiFetch<{ body: unknown; chaos: unknown }>("/v1/preview", {
        method: "POST",
        json: { schemaConfig, query },
      });
      setOut(JSON.stringify({ body: res.body, chaos: res.chaos }, null, 2));
    } catch (e) {
      if (e instanceof ApiError) {
        setErr(JSON.stringify(e.body, null, 2));
        setOut("");
      } else setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Preview schema</h1>
        <p className="mt-2 text-slate-400 max-w-2xl text-sm">
          Gọi <code className="font-mono text-accent">POST /v1/preview</code> — sinh JSON mẫu + chaos (chưa lưu DB). Sau này: sliders %, Reroll tự động, highlight chaos.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-surface-border bg-surface-raised p-4">
          <label className="block space-y-1">
            <span className="text-xs text-slate-400">schemaConfig (JSON)</span>
            <textarea
              rows={16}
              value={schemaJson}
              onChange={(e) => setSchemaJson(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface p-3 font-mono text-xs text-slate-200 outline-none focus:border-accent"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-slate-400">Query (preview pagination)</span>
            <input
              value={queryStr}
              onChange={(e) => setQueryStr(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-xs text-white outline-none focus:border-accent"
            />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={reroll}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-sky-300 disabled:opacity-50"
          >
            {loading ? "…" : "🔄 Reroll preview"}
          </button>
        </div>
        <div className="rounded-xl border border-surface-border bg-surface-raised overflow-hidden flex flex-col min-h-[320px]">
          <div className="border-b border-surface-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Kết quả
          </div>
          {err ? (
            <pre className="p-4 font-mono text-xs text-red-400 overflow-auto flex-1">{err}</pre>
          ) : (
            <pre className="p-4 font-mono text-xs text-slate-300 overflow-auto flex-1 whitespace-pre-wrap">
              {out || "Bấm Reroll để xem JSON."}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
