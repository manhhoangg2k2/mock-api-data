import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { guestEndpoints } from "../db/schema.js";
import { parseSchemaConfig } from "../deps/shared.js";
import { applyLatency } from "../services/latency.js";
import { pickStatus } from "../services/status-roulette.js";
import { generateFromConfig } from "../services/generate-response.js";
import { normalizeResourcePath } from "../util/path.js";
import { validateResponseTemplateConfig } from "../services/response-template.js";

const GUEST_TTL_MS = 30 * 60 * 1000;
const GUEST_MAX_FIELDS = 10;
const GUEST_MAX_ITEMS = 10;
const GUEST_MAX_ENDPOINTS_PER_HOUR = 5;

const createGuestEndpointBody = z.object({
  path: z.string().min(1).max(512),
  methodsAllowed: z.array(z.string().min(1)).min(1),
  schemaConfig: z.unknown(),
  latencyMsMin: z.number().int().min(0).nullable().optional(),
  latencyMsMax: z.number().int().min(0).nullable().optional(),
  statusRoulette: z.record(z.string(), z.number()).nullable().optional(),
});

function clampLimitQuery(
  query: Record<string, string | string[] | undefined>
): Record<string, string | string[] | undefined> {
  const rawLimit = query.limit ?? query.page_size;
  const v = rawLimit === undefined
    ? undefined
    : Number(Array.isArray(rawLimit) ? rawLimit[0] : rawLimit);

  if (v === undefined || !Number.isFinite(v)) return query;

  const clamped = Math.min(GUEST_MAX_ITEMS, Math.max(1, Math.floor(v)));
  const next = { ...query };
  next.limit = String(clamped);
  delete next.page_size;
  return next;
}

export const guestMockRoutes: FastifyPluginAsync = async (app) => {
  // Create / release a guest endpoint (no auth)
  app.post("/v1/guest/endpoints", async (request, reply) => {
    const actorKey = request.ip;
    if (!actorKey) return reply.status(400).send({ error: "missing_actor_key" });

    const parsed = createGuestEndpointBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }

    const now = new Date();
    const since = new Date(now.getTime() - 60 * 60 * 1000);

    let createdInLastHour = 0;
    try {
      const [row] = await db
        .select({ n: count() })
        .from(guestEndpoints)
        .where(and(eq(guestEndpoints.actorKey, actorKey), gt(guestEndpoints.createdAt, since)));
      createdInLastHour = Number(row?.n ?? 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
        return reply.status(500).send({
          error: "database_unreachable",
          message:
            "Không kết nối được Database (DATABASE_URL hostname không resolve được). Kiểm tra lại DATABASE_URL trong `code/.env` (host Neon mới/ đúng).",
        });
      }
      return reply.status(500).send({ error: "internal_error", message: msg });
    }
    if (createdInLastHour >= GUEST_MAX_ENDPOINTS_PER_HOUR) {
      return reply.status(429).send({
        error: "quota_exceeded",
        message: `Guest: tối đa ${GUEST_MAX_ENDPOINTS_PER_HOUR} API / giờ cho IP này.`,
      });
    }

    let schemaModel;
    try {
      schemaModel = parseSchemaConfig(parsed.data.schemaConfig);
    } catch (e) {
      return reply.status(422).send({ error: "invalid_schema", details: e instanceof Error ? e.message : String(e) });
    }

    if (schemaModel.fields.length > GUEST_MAX_FIELDS) {
      return reply.status(403).send({
        error: "guest_fields_limit",
        message: `Guest: tối đa ${GUEST_MAX_FIELDS} fields.`,
      });
    }

    // Enforce guest item count limit by schema defaults
    if (schemaModel.virtualPagination?.enabled) {
      const ps = schemaModel.virtualPagination.pageSizeDefault;
      if (ps !== undefined && ps > GUEST_MAX_ITEMS) {
        return reply.status(403).send({
          error: "guest_items_limit",
          message: `Guest: tối đa ${GUEST_MAX_ITEMS} records.`,
        });
      }
      // If not set, we still cap via query clamping; but set a safe default here.
      schemaModel.virtualPagination.pageSizeDefault = Math.min(
        GUEST_MAX_ITEMS,
        Math.max(1, Number(schemaModel.virtualPagination.pageSizeDefault ?? GUEST_MAX_ITEMS))
      );
    }
    if (schemaModel.responseShape === "array") {
      const n = schemaModel.arrayItemCount ?? 1;
      if (n > GUEST_MAX_ITEMS) {
        return reply.status(403).send({
          error: "guest_items_limit",
          message: `Guest: tối đa ${GUEST_MAX_ITEMS} records.`,
        });
      }
      schemaModel.arrayItemCount = Math.min(GUEST_MAX_ITEMS, Math.max(1, n));
    }

    const templateErr = validateResponseTemplateConfig(schemaModel);
    if (templateErr) {
      return reply.status(422).send({ error: "invalid_template", message: templateErr });
    }

    const pathNormalized = normalizeResourcePath(parsed.data.path);
    if (!pathNormalized) return reply.status(400).send({ error: "invalid_path" });

    const token = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + GUEST_TTL_MS);

    try {
      const methodsAllowed = parsed.data.methodsAllowed.map((m) => m.toUpperCase());
      const [row] = await db
        .insert(guestEndpoints)
        .values({
          actorKey,
          guestToken: token,
          pathNormalized,
          methodsAllowed,
          // Persist the validated/enforced schema model so guest limits always apply server-side.
          schemaConfig: schemaModel as object,
          latencyMsMin: parsed.data.latencyMsMin ?? null,
          latencyMsMax: parsed.data.latencyMsMax ?? null,
          statusRoulette: parsed.data.statusRoulette ?? null,
          expiresAt,
        })
        .returning();

      // Build public URL using host header (includes port in local dev).
      const host = (request.headers["x-forwarded-host"] ?? request.headers["host"] ?? request.hostname) as string;
      const protocol = (request.headers["x-forwarded-proto"] ?? request.protocol) as string;
      const url = `${protocol}://${host}/api/guest/${token}/${pathNormalized}`;

      return reply.status(201).send({
        guestToken: token,
        expiresAt: expiresAt.toISOString(),
        url,
        id: row?.id ?? null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
        return reply.status(500).send({
          error: "database_unreachable",
          message:
            "Không kết nối được Database (DATABASE_URL hostname không resolve được). Kiểm tra lại DATABASE_URL trong `code/.env` (host Neon mới/ đúng).",
        });
      }
      return reply.status(500).send({ error: "internal_error", message: msg });
    }
  });

  // Quota remaining: how many guest endpoint creates left in the current 1-hour window (by IP).
  app.get("/v1/guest/quota", async (request, reply) => {
    const actorKey = request.ip;
    if (!actorKey) return reply.status(400).send({ error: "missing_actor_key" });

    const now = new Date();
    const since = new Date(now.getTime() - 60 * 60 * 1000);

    let createdInLastHour = 0;
    try {
      const [row] = await db
        .select({ n: count() })
        .from(guestEndpoints)
        .where(and(eq(guestEndpoints.actorKey, actorKey), gt(guestEndpoints.createdAt, since)));
      createdInLastHour = Number(row?.n ?? 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
        return reply.status(500).send({
          error: "database_unreachable",
          message:
            "Không kết nối được Database (DATABASE_URL hostname không resolve được). Kiểm tra lại DATABASE_URL trong `code/.env` (host Neon mới/ đúng).",
        });
      }
      return reply.status(500).send({ error: "internal_error", message: msg });
    }

    const remaining = Math.max(0, GUEST_MAX_ENDPOINTS_PER_HOUR - createdInLastHour);
    return reply.status(200).send({
      remaining,
      max: GUEST_MAX_ENDPOINTS_PER_HOUR,
      windowMs: 60 * 60 * 1000,
    });
  });

  // Serve guest mock by token + resource path
  app.route({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    url: "/api/guest/:guestToken/*",
    handler: async (request, reply) => {
      const guestToken = (request.params as { guestToken: string }).guestToken;
      const splat = (request.params as Record<string, string | undefined>)["*"];
      const resourcePath = normalizeResourcePath(splat);

      const rows = await db
        .select()
        .from(guestEndpoints)
        .where(and(eq(guestEndpoints.guestToken, guestToken), eq(guestEndpoints.pathNormalized, resourcePath)))
        .limit(1);

      const endpoint = rows[0];
      if (!endpoint) {
        reply.status(404).send({ error: "not_found", message: "Unknown guest token or path." });
        return;
      }

      if (new Date(endpoint.expiresAt).getTime() <= Date.now()) {
        reply.status(410).send({ error: "expired", message: "Guest mock endpoint expired." });
        return;
      }

      const allowed = endpoint.methodsAllowed.map((m) => m.toUpperCase());
      if (request.method === "OPTIONS") {
        reply.status(204).send();
        return;
      }
      if (!allowed.includes(request.method)) {
        reply.header("Allow", allowed.join(", "));
        reply.status(405).send({ error: "method_not_allowed", allowed });
        return;
      }

      await applyLatency(endpoint.latencyMsMin, endpoint.latencyMsMax);

      const status = pickStatus(endpoint.statusRoulette ?? undefined);
      if (status !== 200) {
        reply.status(status).send({ error: "chaos_status", status });
        return;
      }

      const rawQuery = request.query as Record<string, string | string[] | undefined>;
      const query = clampLimitQuery(rawQuery);

      const { body, chaos } = generateFromConfig(endpoint.schemaConfig, query);
      reply.header("X-DevMock-Chaos", encodeURIComponent(JSON.stringify(chaos)));
      reply.send(body);
    },
  });
};

