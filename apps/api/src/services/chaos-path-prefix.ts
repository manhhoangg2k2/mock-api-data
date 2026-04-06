import type { ChaosMeta } from "./chaos-field.js";
import type { SchemaConfig } from "../deps/shared.js";

function joinPath(prefix: string, path: string): string {
  if (!path) return prefix;
  if (path.startsWith("[")) return `${prefix}${path}`;
  return `${prefix}.${path}`;
}

/**
 * Sau khi bọc response template, path trong chaos (relative tới core) cần thêm tiền tố
 * để khớp JSON cuối (preview / header debug).
 * Template custom: không suy ra được vị trí $body → giữ path gốc.
 */
export function rewriteChaosPathsForResponseTemplate(
  chaos: ChaosMeta[],
  config: SchemaConfig
): ChaosMeta[] {
  const id = config.responseTemplateId ?? "none";
  const prefix = chaosPathPrefixForTemplate(id);
  if (prefix === null) return chaos;
  return chaos.map((c) => ({
    ...c,
    path: joinPath(prefix, c.path),
  }));
}

function chaosPathPrefixForTemplate(id: string): string | null {
  switch (id) {
    case "none":
      return null;
    case "success_body":
      return "body";
    case "ok_result":
      return "result";
    case "version_wrap":
      return "data";
    case "message_ok":
      return "payload";
    case "json_api_like":
      return "data.attributes";
    case "stripe_list_shell":
      return "data";
    case "custom":
      return null;
    default:
      return null;
  }
}
