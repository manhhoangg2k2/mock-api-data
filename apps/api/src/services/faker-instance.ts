import { allFakers, faker } from "@faker-js/faker";
import type { Faker } from "@faker-js/faker";

/** Mặc định English; `code` khớp key trong allFakers (vd: vi, ja, ko). */
export function getFakerForLocale(code?: string | null): Faker {
  const c = code?.trim();
  if (!c || c === "en") return faker;
  const inst = allFakers[c as keyof typeof allFakers];
  if (inst && typeof inst === "object") return inst as Faker;
  return faker;
}
