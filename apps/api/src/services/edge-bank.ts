export const EDGE_BANK: Record<string, readonly unknown[]> = {
  email_bad: ["not-an-email", "", "@@@", "a@b", `${"x".repeat(300)}@test.com`],
  negative_money: [-1, -999999.99, Number.MIN_SAFE_INTEGER],
  zalgo_short: ["t̴̢e̴s̷t̸"],
  empty_array: [[]],
  oversize_string: ["A".repeat(50_000)],
};

export function pickEdge(preset: string | undefined): unknown {
  const key = preset && preset in EDGE_BANK ? preset : "zalgo_short";
  const list = EDGE_BANK[key] ?? EDGE_BANK.zalgo_short;
  return list[Math.floor(Math.random() * list.length)]!;
}
