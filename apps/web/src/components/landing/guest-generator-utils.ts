export type FieldKind = "uuid" | "fullName" | "email" | "string";

export type GuestSchemaField = {
  id: string;
  key: string;
  kind: FieldKind;
};

const NAMES = [
  "Nguyễn An",
  "Trần Bình",
  "Lê Chi",
  "Phạm Dũng",
  "Alex Rivera",
  "Samira Khan",
  "Jordan Lee",
];

function rand(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function randomUuid(seed: number) {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 32; i++) s += hex[Math.floor(rand(seed + i) * 16)];
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

function pickName(seed: number) {
  return NAMES[Math.floor(rand(seed) * NAMES.length)] ?? NAMES[0];
}

function randomString(seed: number) {
  const words = ["alpha", "beta", "preview", "guest", "mock", "delta"];
  return `${words[Math.floor(rand(seed) * words.length)]}-${Math.floor(rand(seed + 1) * 900 + 100)}`;
}

export function buildGuestPreviewObject(
  fields: GuestSchemaField[],
  chaosLevel: number,
  salt: number,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const clamped = Math.max(0, Math.min(100, chaosLevel));
  const chaosP = clamped / 100;

  fields.forEach((f, idx) => {
    const seed = salt * 997 + idx * 13 + f.key.length;
    const roll = rand(seed + salt);

    if (f.kind === "uuid") {
      out[f.key] = randomUuid(seed + salt);
      return;
    }
    if (f.kind === "fullName") {
      out[f.key] = pickName(seed + salt);
      return;
    }
    if (f.kind === "email") {
      const isBad = roll < chaosP * 0.55;
      if (isBad) {
        const mode = Math.floor(rand(seed + 2) * 3);
        out[f.key] =
          mode === 0 ? "" : mode === 1 ? "not-an-email" : "invalid@@devmock.local";
      } else {
        const local = randomString(seed + 3).replace(/[^a-z0-9-]/gi, "");
        out[f.key] = `${local}@example.com`;
      }
      return;
    }
    out[f.key] = `string-${randomString(seed + 4)}`;
  });

  return out;
}

export function isEmailChaosLine(line: string): boolean {
  if (!line.includes('"email"')) return false;
  return (
    line.includes('""') ||
    line.includes('"not-an-email"') ||
    line.includes('"invalid@@devmock.local"')
  );
}
