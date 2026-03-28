import { faker } from "@faker-js/faker";
import type { FieldDef } from "@devmock/shared";

const FINANCE = { min: -5000, max: 50000, fractionDigits: 2 };

export function happyValue(field: FieldDef): unknown {
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
