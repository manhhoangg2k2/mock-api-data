import type { FastifyInstance } from "fastify";
import { FAKER_HINT_KEYS } from "../services/faker-map.js";
import { EDGE_BANK } from "../services/edge-bank.js";
import { getEdgeCatalog } from "../services/edge-catalog.js";

const RESPONSE_TEMPLATE_PRESETS = [
  {
    id: "none",
    title: "Không bọc (raw)",
    description: "Trả đúng object / mảng / paginated do fields tạo ra.",
  },
  {
    id: "success_body",
    title: "{ success, body }",
    description: "Envelope phổ biến: { success: true, body: <payload> }.",
  },
  {
    id: "ok_result",
    title: "{ ok, result }",
    description: "Kiểu flag ngắn: { ok: true, result: <payload> }.",
  },
  {
    id: "version_wrap",
    title: "{ apiVersion, data }",
    description: "Version API: { apiVersion: 1, data: <payload> }.",
  },
  {
    id: "message_ok",
    title: "{ message, payload }",
    description: "Có message: { message: \"OK\", payload: <payload> }.",
  },
  {
    id: "json_api_like",
    title: "JSON:API-ish",
    description: "{ data: { type, attributes: <payload> } } — nhập thêm “resource type”.",
  },
  {
    id: "stripe_list_shell",
    title: "Stripe list (vỏ)",
    description: "{ object: \"list\", data: <payload>, has_more, url } — payload thường là mảng hoặc object tùy bạn.",
  },
  {
    id: "custom",
    title: "Custom (JSON + $body)",
    description: "Tự viết JSON; mọi giá trị đúng bằng chuỗi \"$body\" được thay bằng payload sinh từ fields.",
  },
] as const;

/** Khớp `allFakers` / tài liệu Faker v9 */
const DATA_LOCALES = [
  { code: "en", label: "English (mặc định)" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh_CN", label: "中文（简体）" },
  { code: "zh_TW", label: "中文（繁體）" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt_BR", label: "Português (Brasil)" },
  { code: "en_GB", label: "English (UK)" },
] as const;

export async function registerMetaRoutes(app: FastifyInstance) {
  app.get("/v1/meta/schema-hints", async () => ({
    fakerHints: [...FAKER_HINT_KEYS],
    edgePresets: Object.keys(EDGE_BANK),
    edgeCatalog: getEdgeCatalog(),
    dataLocales: [...DATA_LOCALES],
    responseTemplatePresets: [...RESPONSE_TEMPLATE_PRESETS],
  }));
}
