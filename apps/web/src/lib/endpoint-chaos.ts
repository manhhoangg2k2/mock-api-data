export function chaosSimulationSummaryVi(peakPercent: number): {
  line: string;
  detail: string;
} {
  if (peakPercent <= 0) {
    return {
      line: "Tắt",
      detail: "Luôn trả dữ liệu chuẩn.",
    };
  }
  return {
    line: `Bật (~${peakPercent}%)`,
    detail: `Tối đa ~${peakPercent}% phản hồi lệch (theo field).`,
  };
}

export function estimateChaosPeakPercent(schemaConfig: unknown): number {
  const fields = (
    schemaConfig as {
      fields?: { chaos?: { omitPercent?: number; nullPercent?: number; edgePercent?: number } }[];
    }
  )?.fields;
  if (!fields?.length) return 0;
  let peak = 0;
  for (const f of fields) {
    const c = f.chaos;
    if (!c) continue;
    const sum = (c.omitPercent ?? 0) + (c.nullPercent ?? 0) + (c.edgePercent ?? 0);
    peak = Math.max(peak, Math.min(100, sum));
  }
  return Math.round(peak);
}
