import { parseSchemaConfig, type SchemaConfig } from "../deps/shared.js";
import { buildObject, type ChaosMeta } from "./chaos-field.js";
import { getFakerForLocale } from "./faker-instance.js";
import { withPreviewStressChaos } from "./preview-stress-chaos.js";
import {
  applyResponseTemplate,
  TemplateValidationError,
  validateResponseTemplateConfig,
} from "./response-template.js";

function parseLimitPage(
  query: Record<string, string | string[] | undefined>,
  defaultLimit: number
) {
  const limitRaw = query.limit ?? query.page_size;
  const pageRaw = query.page;
  const parsedLimit =
    limitRaw !== undefined && limitRaw !== ""
      ? Number(Array.isArray(limitRaw) ? limitRaw[0] : limitRaw)
      : NaN;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(100, Math.max(1, parsedLimit))
    : Math.min(100, Math.max(1, defaultLimit));
  const page = Math.max(1, Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw) || 1);
  return { limit, page };
}

export type Generated = { body: unknown; chaos: ChaosMeta[] };

export type GenerateOptions = {
  /** Chỉ preview: bơm chaos tối thiểu để thấy edge/null */
  previewStressChaos?: boolean;
};

export function generateFromConfig(
  rawConfig: unknown,
  query: Record<string, string | string[] | undefined>,
  options?: GenerateOptions
): Generated {
  let config = parseSchemaConfig(rawConfig) as SchemaConfig;
  if (options?.previewStressChaos) {
    config = withPreviewStressChaos(config);
  }

  const faker = getFakerForLocale(config.dataLocale);
  const chaos: ChaosMeta[] = [];
  const baseFields = config.fields.filter((f) => !f.key.startsWith("__"));

  const templateErr = validateResponseTemplateConfig(config);
  if (templateErr) throw new TemplateValidationError(templateErr);

  if (config.virtualPagination?.enabled) {
    const defaultLimit = config.virtualPagination.pageSizeDefault ?? 20;
    const { limit, page } = parseLimitPage(query, defaultLimit);
    const total = config.virtualPagination.totalCount ?? 1_000_000;
    const items: Record<string, unknown>[] = [];
    for (let i = 0; i < limit; i++) {
      const row: Record<string, unknown> = { _index: (page - 1) * limit + i };
      buildObject(baseFields, row, chaos, faker, `items[${i}]`);
      items.push(row);
    }
    const core = {
      data: items,
      meta: { page, limit, total },
    };
    return { chaos, body: applyResponseTemplate(config, core) };
  }

  if (config.responseShape === "array") {
    const n = Math.min(100, Math.max(1, config.arrayItemCount ?? 1));
    const items: Record<string, unknown>[] = [];
    for (let i = 0; i < n; i++) {
      const row: Record<string, unknown> = {};
      buildObject(baseFields, row, chaos, faker, `[${i}]`);
      items.push(row);
    }
    return { chaos, body: applyResponseTemplate(config, items) };
  }

  const obj: Record<string, unknown> = {};
  buildObject(baseFields, obj, chaos, faker);
  return { chaos, body: applyResponseTemplate(config, obj) };
}
