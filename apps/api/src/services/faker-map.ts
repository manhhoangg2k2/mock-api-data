import type { Faker } from "@faker-js/faker";
import type { FieldDef } from "../deps/shared.js";

const FINANCE = { min: -5000, max: 50000, fractionDigits: 2 };

/** Gợi ý `faker` hợp lệ — đồng bộ UI & GET /v1/meta/schema-hints */
export const FAKER_HINT_KEYS = [
  "uuid",
  "fullName",
  "email",
  "financeAmount",
  "phone",
  "country",
  "city",
  "boolean",
] as const;

function slugLike(faker: Faker): string {
  const a = faker.lorem.word();
  const b = faker.lorem.word();
  const n = faker.number.int({ max: 9999 });
  return `${a}-${b}-${n}`.toLowerCase();
}

function colorHex(faker: Faker): string {
  try {
    const rgb = faker.color.rgb({ format: "hex" });
    if (typeof rgb === "string") return rgb;
  } catch {
    /* fall through */
  }
  try {
    const c = faker.internet.color();
    if (typeof c === "string") return c.startsWith("#") ? c : `#${c}`;
  } catch {
    /* fall through */
  }
  return "#4499cc";
}

export function happyValue(field: FieldDef, faker: Faker): unknown {
  const hint = field.faker;

  if (hint) {
    const byHint: Record<string, () => unknown> = {
      uuid: () => faker.string.uuid(),
      fullName: () => faker.person.fullName(),
      email: () => faker.internet.email(),
      financeAmount: () =>
        faker.number.float({ min: FINANCE.min, max: FINANCE.max, fractionDigits: FINANCE.fractionDigits }),
      phone: () => faker.phone.number(),
      country: () => faker.location.country(),
      city: () => faker.location.city(),
      boolean: () => faker.datatype.boolean(),
    };
    const fn = byHint[hint];
    if (fn) return fn();
  }

  switch (field.type) {
    case "date":
      return faker.date.recent({ days: 365 }).toISOString().slice(0, 10);
    case "datetime":
      return faker.date.anytime().toISOString();
    case "time":
      return faker.date.anytime().toISOString().slice(11, 19);
    case "url":
      return faker.internet.url();
    case "email":
      return faker.internet.email();
    case "integer":
      return faker.number.int({ min: -10_000, max: 100_000 });
    case "paragraph":
      return faker.lorem.paragraph();
    case "slug":
      return slugLike(faker);
    case "uuid":
      return faker.string.uuid();
    case "color":
      return colorHex(faker);
    case "ipv4":
      return faker.internet.ipv4();
    case "string":
      return faker.lorem.words({ min: 2, max: 5 });
    case "number":
      return faker.number.int({ min: 0, max: 10_000 });
    case "boolean":
      return faker.datatype.boolean();
    case "array":
      return [faker.lorem.word(), faker.lorem.word()];
    case "object":
      return { a: 1, b: faker.lorem.word() };
    default:
      return null;
  }
}
