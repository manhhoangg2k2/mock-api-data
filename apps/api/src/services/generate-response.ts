import { parseSchemaConfig, type SchemaConfig } from "@devmock/shared";
import { buildObject, type ChaosMeta } from "./chaos-field.js";

function parseLimitPage(query: Record<string, string | string[] | undefined>) {
  const limitRaw = query.limit ?? query.page_size;
  const pageRaw = query.page;
  const limit = Math.min(100, Math.max(1, Number(Array.isArray(limitRaw) ? limitRaw[0] : limitRaw) || 20));
  const page = Math.max(1, Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw) || 1);
  return { limit, page };
}

export type Generated = { body: unknown; chaos: ChaosMeta[] };

export function generateFromConfig(
  rawConfig: unknown,
  query: Record<string, string | string[] | undefined>
): Generated {
  const config = parseSchemaConfig(rawConfig) as SchemaConfig;
  const chaos: ChaosMeta[] = [];
  const baseFields = config.fields.filter((f) => !f.key.startsWith("__"));

  if (config.virtualPagination?.enabled) {
    const { limit, page } = parseLimitPage(query);
    const total = config.virtualPagination.totalCount ?? 1_000_000;
    const items: Record<string, unknown>[] = [];
    for (let i = 0; i < limit; i++) {
      const row: Record<string, unknown> = { _index: (page - 1) * limit + i };
      buildObject(baseFields, row, chaos, `items[${i}]`);
      items.push(row);
    }
    return {
      chaos,
      body: {
        data: items,
        meta: { page, limit, total },
      },
    };
  }

  if (config.responseShape === "array") {
    const row: Record<string, unknown> = {};
    buildObject(baseFields, row, chaos);
    return { chaos, body: [row] };
  }

  const obj: Record<string, unknown> = {};
  buildObject(baseFields, obj, chaos);
  return { chaos, body: obj };
}
