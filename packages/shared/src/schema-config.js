import { z } from "zod";
export const fieldChaosSchema = z.object({
    omitPercent: z.number().min(0).max(100).optional(),
    nullPercent: z.number().min(0).max(100).optional(),
    edgePercent: z.number().min(0).max(100).optional(),
    edgePreset: z.string().optional(),
});
export const fieldDefSchema = z.object({
    key: z.string(),
    type: z.enum(["string", "number", "boolean", "array", "object"]),
    faker: z.string().optional(),
    chaos: fieldChaosSchema.optional(),
});
export const virtualPaginationSchema = z.object({
    enabled: z.boolean(),
    totalCount: z.number().int().positive().optional(),
});
export const schemaConfigSchema = z.object({
    responseShape: z.enum(["object", "array"]).default("object"),
    fields: z.array(fieldDefSchema).default([]),
    virtualPagination: virtualPaginationSchema.optional(),
});
export function parseSchemaConfig(raw) {
    return schemaConfigSchema.parse(raw);
}
//# sourceMappingURL=schema-config.js.map