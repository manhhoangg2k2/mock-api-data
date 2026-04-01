export const EDGE_BANK: Record<string, readonly unknown[]> = {
  /** Email / định dạng */
  email_bad: ["not-an-email", "", "@@@", "a@b", `${"x".repeat(300)}@test.com`],
  /** Số âm / cực trị */
  negative_money: [-1, -999999.99, Number.MIN_SAFE_INTEGER],
  /** Unicode “zalgo” */
  zalgo_short: ["t̴̢e̴s̷t̸"],
  /** Array rỗng (kiểu JSON) */
  empty_array: [[]],
  /** Chuỗi rất dài */
  oversize_string: ["A".repeat(50_000)],
  /** Chuỗi chỉ khoảng trắng / xuống dòng */
  string_whitespace: ["   ", "\n\t\r", "  \n  ", "\u00a0\u00a0"],
  /** Chuỗi gợi ý SQL/injection (test escape, prepared stmt) */
  string_injection_like: ["' OR '1'='1", "'; DROP TABLE users--", "1; DELETE FROM"],
  /** HTML / XSS gợi ý (test sanitize) */
  string_html_snippet: [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<a href=\"javascript:alert(1)\">x</a>",
  ],
  /** Số cực đại an toàn JSON */
  number_max_safe: [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 9_007_199_254_740_991],
  /** Float “lạ” (làm tròn) */
  number_float_junk: [0.30000000000000004, 1e-10, 1.005],
  /** Object rỗng */
  empty_object: [{}],
  /** Chuỗi đa ngôn ngữ + emoji */
  unicode_mixed: ["你好 مرحبا", "Петя — 中文 🎉", "emoji\u200d✨test"],
};

export function pickEdge(preset: string | undefined): unknown {
  const key = preset && preset in EDGE_BANK ? preset : "zalgo_short";
  const list = EDGE_BANK[key] ?? EDGE_BANK.zalgo_short;
  return list[Math.floor(Math.random() * list.length)]!;
}
