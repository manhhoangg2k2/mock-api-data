import type { FieldChaos, FieldDef } from "@devmock/shared";
import { happyValue } from "./faker-map.js";
import { pickEdge } from "./edge-bank.js";

export type FieldOutcome =
  | { kind: "omit" }
  | { kind: "null" }
  | { kind: "edge"; value: unknown }
  | { kind: "happy"; value: unknown };

function normalizePercents(c: FieldChaos | undefined) {
  const omit = Math.max(0, Math.min(100, c?.omitPercent ?? 0));
  const nullP = Math.max(0, Math.min(100, c?.nullPercent ?? 0));
  const edge = Math.max(0, Math.min(100, c?.edgePercent ?? 0));
  const total = omit + nullP + edge;
  const scale = total > 100 ? 100 / total : 1;
  return { omit: omit * scale, nullP: nullP * scale, edge: edge * scale };
}

export function resolveField(field: FieldDef): FieldOutcome {
  const { omit, nullP, edge } = normalizePercents(field.chaos);
  const r = Math.random() * 100;
  if (r < omit) return { kind: "omit" };
  if (r < omit + nullP) return { kind: "null" };
  if (r < omit + nullP + edge) return { kind: "edge", value: pickEdge(field.chaos?.edgePreset) };
  return { kind: "happy", value: happyValue(field) };
}

export type ChaosMeta = { path: string; kind: string };

export function buildObject(
  fields: FieldDef[],
  acc: Record<string, unknown>,
  chaos: ChaosMeta[],
  prefix = ""
) {
  for (const field of fields) {
    const path = prefix ? `${prefix}.${field.key}` : field.key;
    const out = resolveField(field);
    if (out.kind === "omit") continue;
    if (out.kind === "null") {
      acc[field.key] = null;
      chaos.push({ path, kind: "null" });
      continue;
    }
    if (out.kind === "edge") {
      acc[field.key] = out.value;
      chaos.push({ path, kind: "edge" });
      continue;
    }
    acc[field.key] = out.value;
  }
}
