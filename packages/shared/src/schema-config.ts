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

export type FieldChaos = z.infer<typeof fieldChaosSchema>;
export type FieldDef = z.infer<typeof fieldDefSchema>;
export type VirtualPagination = z.infer<typeof virtualPaginationSchema>;
export type SchemaConfig = z.infer<typeof schemaConfigSchema>;

export function parseSchemaConfig(raw: unknown): SchemaConfig {
  return schemaConfigSchema.parse(raw);
}
