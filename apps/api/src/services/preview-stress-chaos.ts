import type { FieldDef, SchemaConfig } from "../deps/shared.js";

/**
 * Chỉ dùng cho POST /v1/preview: tăng tối thiểu % chaos để dễ thấy null/edge.
 * Không lưu vào DB. Field đã cấu hình chaos giữ nguyên edgePreset nếu có.
 */
export function withPreviewStressChaos(config: SchemaConfig): SchemaConfig {
  return {
    ...config,
    fields: config.fields.map((f) => ({
      ...f,
      chaos: mergeStressChaos(f),
    })),
  };
}

function mergeStressChaos(f: FieldDef): NonNullable<FieldDef["chaos"]> {
  const prev = f.chaos;
  const hadAny =
    (prev?.omitPercent ?? 0) > 0 ||
    (prev?.nullPercent ?? 0) > 0 ||
    (prev?.edgePercent ?? 0) > 0;
  return {
    omitPercent: Math.max(prev?.omitPercent ?? 0, 15),
    nullPercent: Math.max(prev?.nullPercent ?? 0, 12),
    edgePercent: Math.max(prev?.edgePercent ?? 0, 22),
    edgePreset: hadAny ? prev?.edgePreset ?? "zalgo_short" : "email_bad",
  };
}
