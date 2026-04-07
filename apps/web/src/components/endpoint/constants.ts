import type { EdgeCatalogGroup } from "./schema-form";

export type DataLocaleRow = { code: string; label: string };

export type ResponseTemplatePresetMeta = { id: string; title: string; description: string };

export type SchemaHints = {
  fakerHints: string[];
  edgePresets: string[];
  dataLocales?: DataLocaleRow[];
  edgeCatalog?: EdgeCatalogGroup[];
  responseTemplatePresets?: ResponseTemplatePresetMeta[];
};

export const DEFAULT_CUSTOM_TEMPLATE_JSON = `{
  "code": 0,
  "message": "success",
  "data": "$body"
}`;

export const FALLBACK_TEMPLATE_PRESETS: ResponseTemplatePresetMeta[] = [
  { id: "none", title: "Không bọc (raw)", description: "Payload đúng như fields tạo." },
  { id: "success_body", title: "{ success, body }", description: "{ success: true, body: … }" },
  { id: "ok_result", title: "{ ok, result }", description: "{ ok: true, result: … }" },
  { id: "version_wrap", title: "{ apiVersion, data }", description: "{ apiVersion: 1, data: … }" },
  { id: "message_ok", title: "{ message, payload }", description: '{ message: "OK", payload: … }' },
  { id: "json_api_like", title: "JSON:API-ish", description: "{ data: { type, attributes } }" },
  { id: "stripe_list_shell", title: "Stripe list (vỏ)", description: '{ object: "list", data: … }' },
  { id: "custom", title: "Custom + $body", description: 'JSON tự viết, dùng "$body" làm placeholder.' },
];

export const FALLBACK_HINTS: SchemaHints = {
  fakerHints: ["uuid", "fullName", "email", "financeAmount", "phone", "country", "city", "boolean"],
  edgePresets: ["email_bad", "negative_money", "zalgo_short", "empty_array", "oversize_string"],
  dataLocales: [
    { code: "en", label: "English (mặc định)" },
    { code: "vi", label: "Tiếng Việt" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" },
    { code: "zh_CN", label: "中文（简体）" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
  ],
  responseTemplatePresets: FALLBACK_TEMPLATE_PRESETS,
};

export const TOUR_STORAGE_KEY = "PaperMock_endpoint_builder_tour_v1";
