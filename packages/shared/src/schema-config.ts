import { z } from "zod";

export const fieldTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "array",
  "object",
  "date",
  "datetime",
  "time",
  "url",
  "email",
  "integer",
  "paragraph",
  "slug",
  "uuid",
  "color",
  "ipv4",
]);

export const fieldChaosSchema = z.object({
  omitPercent: z.number().min(0).max(100).optional(),
  nullPercent: z.number().min(0).max(100).optional(),
  edgePercent: z.number().min(0).max(100).optional(),
  edgePreset: z.string().optional(),
});

export const fieldDefSchema = z.object({
  key: z.string(),
  type: fieldTypeSchema,
  faker: z.string().optional(),
  chaos: fieldChaosSchema.optional(),
});

export const virtualPaginationSchema = z.object({
  enabled: z.boolean(),
  totalCount: z.number().int().positive().optional(),
  /** Dùng khi client không gửi ?limit= — tối đa 100 */
  pageSizeDefault: z.number().int().min(1).max(100).optional(),
  /** Trang mặc định (1-based) khi client không gửi ?page= — server sẽ kẹp theo total/limit */
  defaultPage: z.number().int().min(1).optional(),
});

export const responseTemplateIdSchema = z.enum([
  "none",
  "success_body",
  "ok_result",
  "version_wrap",
  "message_ok",
  "json_api_like",
  "stripe_list_shell",
  "custom",
]);

export const schemaConfigSchema = z.object({
  responseShape: z.enum(["object", "array"]).default("object"),
  fields: z.array(fieldDefSchema).default([]),
  virtualPagination: virtualPaginationSchema.optional(),
  /** Số phần tử khi responseShape = array (không paginate). 1–100 */
  arrayItemCount: z.number().int().min(1).max(100).optional(),
  /** Mã locale Faker (vd: en, vi, ja). Mặc định en. */
  dataLocale: z.string().min(2).max(24).optional(),
  /** Bọc JSON trả về (sau khi generate field). `custom` + `responseTemplateCustom` với token `$body`. */
  responseTemplateId: responseTemplateIdSchema.optional(),
  /** JSON object/array — mọi chỗ giá trị là chuỗi `$body` được thay bằng payload sinh ra */
  responseTemplateCustom: z.unknown().optional(),
  /** Dùng với json_api_like → `data.type` */
  responseTemplateResourceType: z.string().min(1).max(64).optional(),
});

export type FieldType = z.infer<typeof fieldTypeSchema>;
export type FieldChaos = z.infer<typeof fieldChaosSchema>;
export type FieldDef = z.infer<typeof fieldDefSchema>;
export type VirtualPagination = z.infer<typeof virtualPaginationSchema>;
export type SchemaConfig = z.infer<typeof schemaConfigSchema>;
export type ResponseTemplateId = z.infer<typeof responseTemplateIdSchema>;

export function parseSchemaConfig(raw: unknown): SchemaConfig {
  return schemaConfigSchema.parse(raw);
}
