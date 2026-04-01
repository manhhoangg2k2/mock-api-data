import type { SchemaConfig } from "../deps/shared.js";

const BODY = "$body";

export class TemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateValidationError";
  }
}

function containsBodyToken(node: unknown, depth: number): boolean {
  if (depth > 40) return false;
  if (node === BODY) return true;
  if (Array.isArray(node)) return node.some((x) => containsBodyToken(x, depth + 1));
  if (node !== null && typeof node === "object") {
    return Object.values(node as Record<string, unknown>).some((v) => containsBodyToken(v, depth + 1));
  }
  return false;
}

export function validateResponseTemplateConfig(config: SchemaConfig): string | null {
  if (config.responseTemplateId !== "custom") return null;
  if (config.responseTemplateCustom === undefined || config.responseTemplateCustom === null) {
    return "Template custom cần JSON (object hoặc array).";
  }
  if (!containsBodyToken(config.responseTemplateCustom, 0)) {
    return 'Cần ít nhất một giá trị đúng bằng chuỗi "$body" để chèn payload sinh từ fields.';
  }
  return null;
}

export function injectCustomTemplate(template: unknown, core: unknown, depth = 0): unknown {
  if (depth > 50) throw new TemplateValidationError("Template lồng quá sâu (tối đa ~50 tầng).");
  if (template === BODY) return core;
  if (Array.isArray(template)) return template.map((x) => injectCustomTemplate(x, core, depth + 1));
  if (template !== null && typeof template === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template as Record<string, unknown>)) {
      out[k] = injectCustomTemplate(v, core, depth + 1);
    }
    return out;
  }
  return template;
}

export function applyResponseTemplate(config: SchemaConfig, core: unknown): unknown {
  const id = config.responseTemplateId ?? "none";
  if (id === "none") return core;

  if (id === "custom") {
    const raw = config.responseTemplateCustom;
    if (raw === undefined || raw === null) return core;
    return injectCustomTemplate(raw, core);
  }

  const resourceType = config.responseTemplateResourceType?.trim() || "resource";

  switch (id) {
    case "success_body":
      return { success: true, body: core };
    case "ok_result":
      return { ok: true, result: core };
    case "version_wrap":
      return { apiVersion: 1, data: core };
    case "message_ok":
      return { message: "OK", payload: core };
    case "json_api_like":
      return { data: { type: resourceType, attributes: core } };
    case "stripe_list_shell":
      return {
        object: "list",
        data: core,
        has_more: false,
        url: "/v1/mock",
      };
    default:
      return core;
  }
}
