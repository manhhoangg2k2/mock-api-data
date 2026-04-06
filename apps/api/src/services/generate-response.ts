import { parseSchemaConfig, type SchemaConfig } from "../deps/shared.js";
import { buildObject, type ChaosMeta } from "./chaos-field.js";
import { getFakerForLocale } from "./faker-instance.js";
import { withPreviewStressChaos } from "./preview-stress-chaos.js";
import { rewriteChaosPathsForResponseTemplate } from "./chaos-path-prefix.js";
import {
  applyResponseTemplate,
  TemplateValidationError,
  validateResponseTemplateConfig,
} from "./response-template.js";

function parseLimitPage(
  query: Record<string, string | string[] | undefined>,
  defaultLimit: number,
  opts?: { totalCount: number; defaultPage?: number }
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

  const total = Math.max(1, opts?.totalCount ?? 1_000_000);
  const maxPage = Math.max(1, Math.ceil(total / limit));

  const pageParsed =
    pageRaw !== undefined && pageRaw !== ""
      ? Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw)
      : NaN;

  let page: number;
  if (Number.isFinite(pageParsed) && pageParsed >= 1) {
    page = Math.floor(pageParsed);
  } else {
    const d = opts?.defaultPage ?? 1;
    page = Math.max(1, Math.floor(Number(d)) || 1);
  }
  page = Math.min(Math.max(1, page), maxPage);
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
    const total = config.virtualPagination.totalCount ?? 1_000_000;
    const { limit, page } = parseLimitPage(query, defaultLimit, {
      totalCount: total,
      defaultPage: config.virtualPagination.defaultPage,
    });
    const items: Record<string, unknown>[] = [];
    for (let i = 0; i < limit; i++) {
      const row: Record<string, unknown> = { _index: (page - 1) * limit + i };
      buildObject(baseFields, row, chaos, faker, `data[${i}]`);
      items.push(row);
    }
    const core = {
      data: items,
      meta: { page, limit, total },
    };
    const body = applyResponseTemplate(config, core);
    return { chaos: rewriteChaosPathsForResponseTemplate(chaos, config), body };
  }

  if (config.responseShape === "array") {
    const n = Math.min(100, Math.max(1, config.arrayItemCount ?? 1));
    const items: Record<string, unknown>[] = [];
    for (let i = 0; i < n; i++) {
      const row: Record<string, unknown> = {};
      buildObject(baseFields, row, chaos, faker, `[${i}]`);
      items.push(row);
    }
    const body = applyResponseTemplate(config, items);
    return { chaos: rewriteChaosPathsForResponseTemplate(chaos, config), body };
  }

  const obj: Record<string, unknown> = {};
  buildObject(baseFields, obj, chaos, faker);
  const body = applyResponseTemplate(config, obj);
  return { chaos: rewriteChaosPathsForResponseTemplate(chaos, config), body };
}
