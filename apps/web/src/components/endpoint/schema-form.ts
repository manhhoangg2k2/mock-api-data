export type FieldTypeInner =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "date"
  | "datetime"
  | "time"
  | "url"
  | "email"
  | "integer"
  | "paragraph"
  | "slug"
  | "uuid"
  | "color"
  | "ipv4";

export type FieldFormRow = {
  clientId: string;
  key: string;
  type: FieldTypeInner;
  faker: string;
  omitPercent: number;
  nullPercent: number;
  edgePercent: number;
  edgePreset: string;
};

export const FIELD_TYPES: FieldTypeInner[] = [
  "string",
  "number",
  "integer",
  "boolean",
  "array",
  "object",
  "date",
  "datetime",
  "time",
  "url",
  "email",
  "paragraph",
  "slug",
  "uuid",
  "color",
  "ipv4",
];

export const TYPE_LABELS_VI: Partial<Record<FieldTypeInner, string>> = {
  string: "Chuỗi ngẫu nhiên",
  number: "Số (0–10k)",
  integer: "Số nguyên",
  boolean: "true / false",
  array: "Mảng chữ ngắn",
  object: "Object lồng mẫu",
  date: "Ngày (YYYY-MM-DD)",
  datetime: "ISO date-time",
  time: "Giờ (HH:mm:ss)",
  url: "URL",
  email: "Email (happy path)",
  paragraph: "Đoạn văn dài",
  slug: "slug-url",
  uuid: "UUID chuỗi",
  color: "Màu hex",
  ipv4: "IPv4",
};

export type ResponsePresetId = "single_object" | "array_list" | "paginated" | "custom";

export const RESPONSE_PRESETS: {
  id: ResponsePresetId;
  title: string;
  description: string;
}[] = [
  {
    id: "single_object",
    title: "Một object",
    description: "{ …fields } — REST resource đơn",
  },
  {
    id: "array_list",
    title: "Mảng N phần tử",
    description: "[ {...}, {...} ] — danh sách không meta",
  },
  {
    id: "paginated",
    title: "Paginated",
    description: "{ data: [...], meta } — ?limit=&page=",
  },
  {
    id: "custom",
    title: "Tùy chỉnh",
    description: "Tự chọn object/array + pagination",
  },
];

export const METHOD_OPTIONS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
] as const;

export const FAKER_LABELS_VI: Record<string, string> = {
  uuid: "UUID",
  fullName: "Họ tên",
  email: "Email",
  financeAmount: "Số tiền (finance)",
  phone: "Điện thoại",
  country: "Quốc gia",
  city: "Thành phố",
  boolean: "Boolean ngẫu nhiên",
};

export const EDGE_LABELS_VI: Record<string, string> = {
  email_bad: "Email sai / rỗng / cực dài",
  negative_money: "Số âm cực đoan",
  zalgo_short: "Chuỗi zalgo (mặc định edge)",
  empty_array: "Array rỗng",
  oversize_string: "Chuỗi cực lớn",
  string_whitespace: "Chỉ khoảng trắng",
  string_injection_like: "Chuỗi kiểu SQL/injection",
  string_html_snippet: "HTML / XSS snippet",
  number_max_safe: "Số MAX/MIN_SAFE_INTEGER",
  number_float_junk: "Float làm tròn lạ",
  empty_object: "Object rỗng {}",
  unicode_mixed: "Đa ngôn ngữ + emoji",
};

export const EDGE_HELP_VI: Record<string, string> = {
  email_bad:
    "Giá trị không phải email hợp lệ: chuỗi lạ, rỗng, hoặc email quá dài — hay gặp khi test validation form.",
  negative_money: "Số âm hoặc cực nhỏ — phù hợp test số dư, giá, refund.",
  zalgo_short: "Chuỗi có ký tự kết hợp dấu (unicode) — test font / truncate / XSS filter.",
  empty_array: "Mảng [] — test UI list rỗng, reduce, map.",
  oversize_string: "Chuỗi rất dài (~50k ký tự) — test giới hạn DB, JSON, log.",
  string_whitespace: "Người dùng chỉ nhập space/tab — test trim, required, normalize.",
  string_injection_like: "Pattern gợi ý SQL/injection — test prepared statement, escape.",
  string_html_snippet: "Thẻ HTML/script — test sanitize, CSP, rich text.",
  number_max_safe: "Biên int JSON an toàn — test BigInt, overflow UI.",
  number_float_junk: "Float khó so sánh — test tiền tệ, toFixed.",
  empty_object: "Object không có key — test optional nested, keys().",
  unicode_mixed: "Nhiều script + emoji — test encoding, collation.",
};

export const RESPONSE_TEMPLATE_IDS = [
  "none",
  "success_body",
  "ok_result",
  "version_wrap",
  "message_ok",
  "json_api_like",
  "stripe_list_shell",
  "custom",
] as const;

export type ResponseTemplateIdStr = (typeof RESPONSE_TEMPLATE_IDS)[number];

export type EdgeCatalogGroup = {
  id: string;
  labelVi: string;
  items: { id: string; labelVi: string; hintVi: string }[];
};

export type ResponseTemplatePresetMeta = {
  id: string;
  title: string;
  description: string;
};

/**
 * Ba tỷ lệ (bỏ trường / null / giá trị xấu) không vượt quá 100% tổng;
 * phần còn lại → sinh dữ liệu chuẩn (Faker). Thay đổi một thanh sẽ tự giới hạn các thanh sau.
 */
export function applyOmitPercent(row: FieldFormRow, omit: number): FieldFormRow {
  const o = Math.min(100, Math.max(0, Math.round(omit)));
  const maxN = 100 - o;
  const n = Math.min(row.nullPercent, maxN);
  const maxE = 100 - o - n;
  const e = Math.min(row.edgePercent, maxE);
  return { ...row, omitPercent: o, nullPercent: n, edgePercent: e };
}

export function applyNullPercent(row: FieldFormRow, nullP: number): FieldFormRow {
  const maxN = 100 - row.omitPercent;
  const n = Math.min(maxN, Math.max(0, Math.round(nullP)));
  const maxE = 100 - row.omitPercent - n;
  const e = Math.min(row.edgePercent, maxE);
  return { ...row, nullPercent: n, edgePercent: e };
}

export function applyEdgePercent(row: FieldFormRow, edge: number): FieldFormRow {
  const maxE = 100 - row.omitPercent - row.nullPercent;
  const e = Math.min(maxE, Math.max(0, Math.round(edge)));
  return { ...row, edgePercent: e };
}

/** Chuẩn hóa từ API: nếu tổng > 100, scale như backend; nếu ≤ 100 giữ nguyên. */
export function normalizeFieldPercentsFromApi(
  omit: number,
  nullP: number,
  edge: number
): Pick<FieldFormRow, "omitPercent" | "nullPercent" | "edgePercent"> {
  let o = Math.min(100, Math.max(0, Math.round(omit)));
  let n = Math.min(100, Math.max(0, Math.round(nullP)));
  let e = Math.min(100, Math.max(0, Math.round(edge)));
  const sum = o + n + e;
  if (sum === 0) return { omitPercent: 0, nullPercent: 0, edgePercent: 0 };
  if (sum <= 100) return { omitPercent: o, nullPercent: n, edgePercent: e };
  const scale = 100 / sum;
  let o2 = Math.round(o * scale);
  let n2 = Math.round(n * scale);
  let e2 = 100 - o2 - n2;
  if (e2 < 0) {
    e2 = 0;
    n2 = Math.max(0, 100 - o2);
  }
  return { omitPercent: o2, nullPercent: n2, edgePercent: e2 };
}

export function newFieldRow(partial?: Partial<Omit<FieldFormRow, "clientId">>): FieldFormRow {
  return {
    clientId: crypto.randomUUID(),
    key: "",
    type: "string",
    faker: "",
    omitPercent: 0,
    nullPercent: 0,
    edgePercent: 0,
    edgePreset: "zalgo_short",
    ...partial,
  };
}

export function defaultEndpointFields(): FieldFormRow[] {
  return [
    newFieldRow({ key: "id", type: "string", faker: "uuid" }),
    newFieldRow({ key: "name", type: "string", faker: "fullName" }),
  ];
}

export type BuildSchemaInput = {
  responseShape: "object" | "array";
  fields: FieldFormRow[];
  paginationEnabled: boolean;
  paginationTotal: number;
  pageSizeDefault: number;
  /** Trang mặc định (1-based) khi không có ?page= */
  paginationDefaultPage: number;
  arrayItemCount: number;
  dataLocale: string;
  responseTemplateId: ResponseTemplateIdStr;
  responseTemplateResourceType: string;
  responseTemplateCustomJson: string;
};

export function buildSchemaConfigFromForm(input: BuildSchemaInput): Record<string, unknown> {
  const fields = input.fields
    .map((f) => ({ ...f, key: f.key.trim() }))
    .filter((f) => f.key.length > 0)
    .map((f) => {
      const hasChaos = f.omitPercent > 0 || f.nullPercent > 0 || f.edgePercent > 0;
      const chaos = hasChaos
        ? {
            omitPercent: f.omitPercent,
            nullPercent: f.nullPercent,
            edgePercent: f.edgePercent,
            ...(f.edgePercent > 0 && f.edgePreset ? { edgePreset: f.edgePreset } : {}),
          }
        : undefined;
      return {
        key: f.key,
        type: f.type,
        ...(f.faker ? { faker: f.faker } : {}),
        ...(chaos ? { chaos } : {}),
      };
    });

  const out: Record<string, unknown> = {
    responseShape: input.responseShape,
    fields,
  };

  const loc = input.dataLocale?.trim();
  if (loc && loc !== "en") {
    out.dataLocale = loc;
  }

  if (input.paginationEnabled) {
    const totalCount = Math.max(1, Math.floor(input.paginationTotal) || 1_000_000);
    const pageSizeDefault = Math.min(100, Math.max(1, Math.floor(input.pageSizeDefault) || 20));
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSizeDefault));
    const defaultPage = Math.min(
      Math.max(1, Math.floor(input.paginationDefaultPage) || 1),
      maxPage
    );
    out.virtualPagination = {
      enabled: true,
      totalCount,
      pageSizeDefault,
      defaultPage,
    };
  } else if (input.responseShape === "array") {
    out.arrayItemCount = Math.min(100, Math.max(1, Math.floor(input.arrayItemCount) || 1));
  }

  const tid = input.responseTemplateId ?? "none";
  if (tid !== "none") {
    out.responseTemplateId = tid;
  }
  if (tid === "json_api_like") {
    const rt = input.responseTemplateResourceType?.trim().slice(0, 64);
    if (rt) out.responseTemplateResourceType = rt;
  }
  if (tid === "custom") {
    try {
      out.responseTemplateCustom = JSON.parse(input.responseTemplateCustomJson.trim() || "null") as unknown;
    } catch {
      /* validateResponseTemplateForm đã chặn */
    }
  }

  return out;
}

function jsonHasBodyToken(node: unknown, depth = 0): boolean {
  if (depth > 40) return false;
  if (node === "$body") return true;
  if (Array.isArray(node)) return node.some((x) => jsonHasBodyToken(x, depth + 1));
  if (node !== null && typeof node === "object") {
    return Object.values(node as Record<string, unknown>).some((v) => jsonHasBodyToken(v, depth + 1));
  }
  return false;
}

/** Kiểm tra form trước khi preview / lưu */
export function validateResponseTemplateForm(
  templateId: ResponseTemplateIdStr,
  resourceType: string,
  customJson: string
): string | null {
  if (!templateId || templateId === "none") return null;
  if (templateId === "json_api_like" && !resourceType.trim()) {
    return "Nhập resource type (vd: users, articles) cho template JSON:API.";
  }
  if (templateId === "custom") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(customJson.trim() || "null");
    } catch {
      return "Template custom phải là JSON hợp lệ.";
    }
    if (parsed === null || typeof parsed !== "object") {
      return "Template custom phải là object hoặc array JSON.";
    }
    if (!jsonHasBodyToken(parsed, 0)) {
      return 'Trong JSON cần có ít nhất một giá trị đúng bằng chuỗi "$body" (placeholder payload).';
    }
  }
  return null;
}

export function validateEndpointForm(
  path: string,
  methods: Set<string>,
  fields: FieldFormRow[],
  template?: { id: ResponseTemplateIdStr; resourceType: string; customJson: string }
): string | null {
  const p = path.trim();
  if (!p) return "Path không được để trống.";
  if (methods.size === 0) return "Chọn ít nhất một HTTP method.";

  const keys = fields.map((f) => f.key.trim()).filter(Boolean);
  if (keys.length === 0) return "Thêm ít nhất một field có tên (key).";

  const seen = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) return `Trùng key: "${k}".`;
    seen.add(k);
  }

  if (template) {
    const te = validateResponseTemplateForm(template.id, template.resourceType, template.customJson);
    if (te) return te;
  }

  return null;
}

export type StatusRouletteRow = { clientId: string; code: number; weight: number };

/** Các mã HTTP thường dùng cho status roulette (kèm mô tả tiếng Việt). */
export const ROULETTE_HTTP_PRESETS = [
  { code: 200, label: "OK", description: "Thành công, có body" },
  { code: 201, label: "Created", description: "Đã tạo tài nguyên mới" },
  { code: 204, label: "No Content", description: "Thành công, không trả body" },
  { code: 400, label: "Bad Request", description: "Request không hợp lệ / sai định dạng" },
  { code: 401, label: "Unauthorized", description: "Chưa xác thực hoặc token hết hạn" },
  { code: 403, label: "Forbidden", description: "Đã xác thực nhưng không có quyền" },
  { code: 404, label: "Not Found", description: "Không tìm thấy tài nguyên" },
  { code: 409, label: "Conflict", description: "Xung đột (ví dụ bản ghi trùng)" },
  { code: 422, label: "Unprocessable Entity", description: "Lỗi validation nghiệp vụ" },
  { code: 429, label: "Too Many Requests", description: "Vượt giới hạn tần suất gọi API" },
  { code: 500, label: "Internal Server Error", description: "Lỗi không mong đợi phía server" },
  { code: 502, label: "Bad Gateway", description: "Gateway / upstream phản hồi lỗi" },
  { code: 503, label: "Service Unavailable", description: "Dịch vụ tạm ngưng / quá tải" },
] as const;

export const ROULETTE_PRESET_CODE_SET: Set<number> = new Set(
  ROULETTE_HTTP_PRESETS.map((p) => p.code)
);

export function newRouletteRow(code = 200, weight = 100): StatusRouletteRow {
  return { clientId: crypto.randomUUID(), code, weight };
}

export function buildStatusRouletteMap(
  enabled: boolean,
  rows: StatusRouletteRow[]
): Record<string, number> | null {
  if (!enabled) return null;
  const acc: Record<string, number> = {};
  for (const r of rows) {
    const w = Math.max(0, r.weight);
    if (w <= 0) continue;
    const c = Math.min(599, Math.max(100, Math.floor(r.code) || 200));
    acc[String(c)] = (acc[String(c)] ?? 0) + w;
  }
  return Object.keys(acc).length ? acc : null;
}

export function applyResponsePreset(
  id: ResponsePresetId,
  setters: {
    setResponseShape: (v: "object" | "array") => void;
    setPaginationEnabled: (v: boolean) => void;
  }
) {
  switch (id) {
    case "single_object":
      setters.setResponseShape("object");
      setters.setPaginationEnabled(false);
      break;
    case "array_list":
      setters.setResponseShape("array");
      setters.setPaginationEnabled(false);
      break;
    case "paginated":
      setters.setPaginationEnabled(true);
      break;
    case "custom":
      break;
    default:
      break;
  }
}

const EDITOR_DEFAULT_CUSTOM_JSON = `{
  "code": 0,
  "message": "success",
  "data": "$body"
}`;

export type EditorFormFromSchema = {
  responsePreset: ResponsePresetId;
  responseShape: "object" | "array";
  fields: FieldFormRow[];
  paginationEnabled: boolean;
  paginationTotal: number;
  pageSizeDefault: number;
  paginationDefaultPage: number;
  arrayItemCount: number;
  dataLocale: string;
  responseTemplateId: ResponseTemplateIdStr;
  responseTemplateResourceType: string;
  responseTemplateCustomJson: string;
};

/** Đưa schemaConfig từ API về state form editor (đối chiếu buildSchemaConfigFromForm). */
export function schemaConfigToEditorForm(schemaConfig: unknown): EditorFormFromSchema {
  const sc = schemaConfig && typeof schemaConfig === "object" ? (schemaConfig as Record<string, unknown>) : {};
  const responseShape = sc.responseShape === "array" ? "array" : "object";
  const vp = sc.virtualPagination as
    | { enabled?: boolean; totalCount?: number; pageSizeDefault?: number; defaultPage?: number }
    | undefined;
  const paginationEnabled = Boolean(vp?.enabled);
  let responsePreset: ResponsePresetId = "custom";
  if (paginationEnabled) responsePreset = "paginated";
  else if (responseShape === "array") responsePreset = "array_list";
  else responsePreset = "single_object";

  const rawFields = Array.isArray(sc.fields) ? sc.fields : [];
  const fields: FieldFormRow[] =
    rawFields.length === 0
      ? defaultEndpointFields()
      : rawFields.map((item) => {
          const x = item as Record<string, unknown>;
          const chaos = x.chaos as Record<string, unknown> | undefined;
          const t = x.type as string;
          const type = FIELD_TYPES.includes(t as FieldTypeInner) ? (t as FieldTypeInner) : "string";
          const pct = normalizeFieldPercentsFromApi(
            Number(chaos?.omitPercent ?? 0),
            Number(chaos?.nullPercent ?? 0),
            Number(chaos?.edgePercent ?? 0)
          );
          return newFieldRow({
            key: String(x.key ?? ""),
            type,
            faker: typeof x.faker === "string" ? x.faker : "",
            ...pct,
            edgePreset: typeof chaos?.edgePreset === "string" ? chaos.edgePreset : "zalgo_short",
          });
        });

  const tid = sc.responseTemplateId;
  const responseTemplateId: ResponseTemplateIdStr =
    typeof tid === "string" && (RESPONSE_TEMPLATE_IDS as readonly string[]).includes(tid)
      ? (tid as ResponseTemplateIdStr)
      : "none";

  let responseTemplateCustomJson = EDITOR_DEFAULT_CUSTOM_JSON;
  if (sc.responseTemplateCustom != null) {
    try {
      responseTemplateCustomJson = JSON.stringify(sc.responseTemplateCustom, null, 2);
    } catch {
      /* keep default */
    }
  }

  const pageSizeDefault = Math.min(100, Math.max(1, Number(vp?.pageSizeDefault ?? 20)));
  const paginationTotal = Math.max(1, Number(vp?.totalCount ?? 1_000_000));
  const maxPage = Math.max(1, Math.ceil(paginationTotal / pageSizeDefault));
  const rawDefaultPage = Math.max(1, Math.floor(Number(vp?.defaultPage ?? 1)) || 1);
  const paginationDefaultPage = Math.min(rawDefaultPage, maxPage);

  return {
    responsePreset,
    responseShape,
    fields,
    paginationEnabled,
    paginationTotal,
    pageSizeDefault,
    paginationDefaultPage,
    arrayItemCount: Math.min(100, Math.max(1, Number(sc.arrayItemCount ?? 5))),
    dataLocale: typeof sc.dataLocale === "string" && sc.dataLocale.trim() ? sc.dataLocale.trim() : "en",
    responseTemplateId,
    responseTemplateResourceType:
      typeof sc.responseTemplateResourceType === "string" ? sc.responseTemplateResourceType : "users",
    responseTemplateCustomJson,
  };
}
