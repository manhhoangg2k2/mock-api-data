import { EDGE_BANK } from "./edge-bank.js";

export type EdgePresetItemMeta = {
  id: string;
  labelVi: string;
  hintVi: string;
};

export type EdgePresetGroupMeta = {
  id: string;
  labelVi: string;
  items: EdgePresetItemMeta[];
};

/** Nhóm UX — chỉ preset có trong EDGE_BANK mới hiện */
const GROUPS: EdgePresetGroupMeta[] = [
  {
    id: "email_money",
    labelVi: "Email & số tiền",
    items: [
      {
        id: "email_bad",
        labelVi: "Email không hợp lệ / rỗng / quá dài",
        hintVi: "Test validation form, trim, max length.",
      },
      {
        id: "negative_money",
        labelVi: "Số âm / cực nhỏ",
        hintVi: "Số dư, giá, refund, decimal.",
      },
    ],
  },
  {
    id: "string_security",
    labelVi: "Chuỗi — injection & HTML",
    items: [
      {
        id: "string_injection_like",
        labelVi: "Chuỗi kiểu SQL / injection",
        hintVi: "Parameter binding, ORM, escape.",
      },
      {
        id: "string_html_snippet",
        labelVi: "HTML / XSS snippet",
        hintVi: "Sanitize, CSP, rich text.",
      },
      {
        id: "string_whitespace",
        labelVi: "Chỉ khoảng trắng",
        hintVi: "Trim, required, normalize input.",
      },
    ],
  },
  {
    id: "unicode_size",
    labelVi: "Unicode & kích thước",
    items: [
      {
        id: "zalgo_short",
        labelVi: "Chuỗi zalgo (dấu kết hợp)",
        hintVi: "Font, truncate, grapheme.",
      },
      {
        id: "unicode_mixed",
        labelVi: "Đa ngôn ngữ + emoji",
        hintVi: "Encoding, collation, emoji width.",
      },
      {
        id: "oversize_string",
        labelVi: "Chuỗi cực lớn (~50k)",
        hintVi: "Giới hạn DB, log, JSON payload.",
      },
    ],
  },
  {
    id: "number_shape",
    labelVi: "Số — hình dạng",
    items: [
      {
        id: "number_max_safe",
        labelVi: "MAX/MIN_SAFE_INTEGER",
        hintVi: "BigInt migration, overflow UI.",
      },
      {
        id: "number_float_junk",
        labelVi: "Float làm tròn lạ",
        hintVi: "toFixed, so sánh float, tiền tệ.",
      },
    ],
  },
  {
    id: "structure",
    labelVi: "Cấu trúc JSON",
    items: [
      {
        id: "empty_array",
        labelVi: "Mảng rỗng []",
        hintVi: "List rỗng, reduce, .length.",
      },
      {
        id: "empty_object",
        labelVi: "Object rỗng {}",
        hintVi: "Optional nested, Object.keys.",
      },
    ],
  },
];

function presetExists(id: string): boolean {
  return id in EDGE_BANK;
}

export function getEdgeCatalog(): EdgePresetGroupMeta[] {
  return GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => presetExists(i.id)),
  })).filter((g) => g.items.length > 0);
}
