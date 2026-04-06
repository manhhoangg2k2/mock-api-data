import { and, count, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { parseSchemaConfig } from "../deps/shared.js";
import { ZodError, z } from "zod";
import { MAX_ENDPOINTS_PER_USER, MAX_PROJECTS_PER_USER } from "../const/limits.js";
import { db } from "../db/client.js";
import { endpoints, projects } from "../db/schema.js";
import { generateFromConfig } from "../services/generate-response.js";
import {
  TemplateValidationError,
  validateResponseTemplateConfig,
} from "../services/response-template.js";
import { normalizeResourcePath } from "../util/path.js";
import { assertValidSlug } from "../util/slug.js";

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

async function countProjects(userId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(projects).where(eq(projects.userId, userId));
  return Number(row?.n ?? 0);
}

async function countEndpoints(userId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(endpoints).where(eq(endpoints.userId, userId));
  return Number(row?.n ?? 0);
}

async function getProjectForUser(projectId: string, userId: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

const createProjectBody = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(3).max(32),
});

const patchProjectBody = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(3).max(32).optional(),
});

const createEndpointBody = z.object({
  path: z.string().min(1).max(512),
  methodsAllowed: z.array(z.string().min(1)).min(1),
  schemaConfig: z.unknown(),
  latencyMsMin: z.number().int().min(0).nullable().optional(),
  latencyMsMax: z.number().int().min(0).nullable().optional(),
  statusRoulette: z.record(z.string(), z.number()).nullable().optional(),
});

const patchEndpointBody = createEndpointBody.partial();

const previewBody = z.object({
  schemaConfig: z.unknown(),
  query: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  /** Chỉ áp dụng khi preview: tăng tối thiểu % chaos để thấy null/edge */
  previewStressChaos: z.boolean().optional(),
});

export async function registerV1DashboardRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  app.get("/v1/me/quotas", auth, async (request) => {
    const userId = (request.user as { sub: string }).sub;
    const used = await countEndpoints(userId);
    const max = MAX_ENDPOINTS_PER_USER;
    return {
      endpoints: {
        used,
        max,
        remaining: Math.max(0, max - used),
      },
    };
  });

  app.get("/v1/projects", auth, async (request) => {
    const userId = (request.user as { sub: string }).sub;
    return db.select().from(projects).where(eq(projects.userId, userId));
  });

  app.post("/v1/projects", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const parsed = createProjectBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    const { name, slug } = parsed.data;
    try {
      assertValidSlug("slug", slug);
    } catch (e) {
      return reply.status(400).send({ error: "invalid_slug", message: (e as Error).message });
    }

    const n = await countProjects(userId);
    if (n >= MAX_PROJECTS_PER_USER) {
      return reply.status(403).send({
        error: "quota_exceeded",
        message: `Tối đa ${MAX_PROJECTS_PER_USER} project (free tier).`,
      });
    }

    try {
      const [row] = await db
        .insert(projects)
        .values({ userId, name, slug })
        .returning();
      return reply.status(201).send(row);
    } catch (e) {
      if (isUniqueViolation(e)) {
        return reply.status(409).send({ error: "conflict", message: "Slug đã tồn tại trong tài khoản." });
      }
      throw e;
    }
  });

  app.get<{ Params: { projectId: string } }>("/v1/projects/:projectId", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { projectId } = request.params;
    const p = await getProjectForUser(projectId, userId);
    if (!p) return reply.status(404).send({ error: "not_found" });
    return p;
  });

  app.patch<{ Params: { projectId: string } }>("/v1/projects/:projectId", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { projectId } = request.params;
    const p = await getProjectForUser(projectId, userId);
    if (!p) return reply.status(404).send({ error: "not_found" });

    const parsed = patchProjectBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    if (parsed.data.slug) {
      try {
        assertValidSlug("slug", parsed.data.slug);
      } catch (e) {
        return reply.status(400).send({ error: "invalid_slug", message: (e as Error).message });
      }
    }

    try {
      const [row] = await db
        .update(projects)
        .set({
          ...(parsed.data.name != null ? { name: parsed.data.name } : {}),
          ...(parsed.data.slug != null ? { slug: parsed.data.slug } : {}),
        })
        .where(eq(projects.id, projectId))
        .returning();
      return row;
    } catch (e) {
      if (isUniqueViolation(e)) {
        return reply.status(409).send({ error: "conflict", message: "Slug đã tồn tại." });
      }
      throw e;
    }
  });

  app.delete<{ Params: { projectId: string } }>("/v1/projects/:projectId", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { projectId } = request.params;
    const p = await getProjectForUser(projectId, userId);
    if (!p) return reply.status(404).send({ error: "not_found" });
    await db.delete(projects).where(eq(projects.id, projectId));
    return reply.status(204).send();
  });

  app.get<{ Params: { projectId: string } }>("/v1/projects/:projectId/endpoints", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { projectId } = request.params;
    const p = await getProjectForUser(projectId, userId);
    if (!p) return reply.status(404).send({ error: "not_found" });
    return db.select().from(endpoints).where(eq(endpoints.projectId, projectId));
  });

  app.post<{ Params: { projectId: string } }>("/v1/projects/:projectId/endpoints", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { projectId } = request.params;
    const p = await getProjectForUser(projectId, userId);
    if (!p) return reply.status(404).send({ error: "not_found" });

    const parsed = createEndpointBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }

    let schemaModel;
    try {
      schemaModel = parseSchemaConfig(parsed.data.schemaConfig);
    } catch (e) {
      if (e instanceof ZodError) {
        return reply.status(422).send({ error: "invalid_schema", details: e.flatten() });
      }
      throw e;
    }
    const templateErr = validateResponseTemplateConfig(schemaModel);
    if (templateErr) {
      return reply.status(422).send({ error: "invalid_template", message: templateErr });
    }

    const pathNormalized = normalizeResourcePath(parsed.data.path);
    if (!pathNormalized) {
      return reply.status(400).send({ error: "invalid_path", message: "Path không hợp lệ." });
    }

    const n = await countEndpoints(userId);
    if (n >= MAX_ENDPOINTS_PER_USER) {
      return reply.status(403).send({
        error: "quota_exceeded",
        message: `Tối đa ${MAX_ENDPOINTS_PER_USER} endpoint (free tier).`,
      });
    }

    try {
      const [row] = await db
        .insert(endpoints)
        .values({
          projectId,
          userId,
          pathNormalized,
          methodsAllowed: parsed.data.methodsAllowed.map((m) => m.toUpperCase()),
          schemaConfig: parsed.data.schemaConfig as object,
          latencyMsMin: parsed.data.latencyMsMin ?? null,
          latencyMsMax: parsed.data.latencyMsMax ?? null,
          statusRoulette: parsed.data.statusRoulette ?? null,
        })
        .returning();
      return reply.status(201).send(row);
    } catch (e) {
      if (isUniqueViolation(e)) {
        return reply
          .status(409)
          .send({ error: "conflict", message: "Path này đã tồn tại cho user (unique theo spec)." });
      }
      throw e;
    }
  });

  app.get<{ Params: { endpointId: string } }>("/v1/endpoints/:endpointId", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { endpointId } = request.params;
    const rows = await db
      .select()
      .from(endpoints)
      .where(and(eq(endpoints.id, endpointId), eq(endpoints.userId, userId)))
      .limit(1);
    const row = rows[0];
    if (!row) return reply.status(404).send({ error: "not_found" });
    return row;
  });

  app.patch<{ Params: { endpointId: string } }>("/v1/endpoints/:endpointId", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { endpointId } = request.params;
    const rows = await db
      .select()
      .from(endpoints)
      .where(and(eq(endpoints.id, endpointId), eq(endpoints.userId, userId)))
      .limit(1);
    const existing = rows[0];
    if (!existing) return reply.status(404).send({ error: "not_found" });

    const parsed = patchEndpointBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }

    if (parsed.data.schemaConfig !== undefined) {
      let patchSchema;
      try {
        patchSchema = parseSchemaConfig(parsed.data.schemaConfig);
      } catch (e) {
        if (e instanceof ZodError) {
          return reply.status(422).send({ error: "invalid_schema", details: e.flatten() });
        }
        throw e;
      }
      const templateErr = validateResponseTemplateConfig(patchSchema);
      if (templateErr) {
        return reply.status(422).send({ error: "invalid_template", message: templateErr });
      }
    }

    let pathNormalized = existing.pathNormalized;
    if (parsed.data.path != null) {
      pathNormalized = normalizeResourcePath(parsed.data.path);
      if (!pathNormalized) {
        return reply.status(400).send({ error: "invalid_path" });
      }
    }

    const methodsAllowed =
      parsed.data.methodsAllowed != null
        ? parsed.data.methodsAllowed.map((m) => m.toUpperCase())
        : undefined;

    const nextPath =
      parsed.data.path != null && pathNormalized !== existing.pathNormalized ? pathNormalized : undefined;
    const setPayload = {
      ...(nextPath != null ? { pathNormalized: nextPath } : {}),
      ...(methodsAllowed != null ? { methodsAllowed } : {}),
      ...(parsed.data.schemaConfig !== undefined ? { schemaConfig: parsed.data.schemaConfig as object } : {}),
      ...(parsed.data.latencyMsMin !== undefined ? { latencyMsMin: parsed.data.latencyMsMin } : {}),
      ...(parsed.data.latencyMsMax !== undefined ? { latencyMsMax: parsed.data.latencyMsMax } : {}),
      ...(parsed.data.statusRoulette !== undefined ? { statusRoulette: parsed.data.statusRoulette } : {}),
    };

    if (Object.keys(setPayload).length === 0) {
      return existing;
    }

    try {
      const [row] = await db
        .update(endpoints)
        .set(setPayload)
        .where(eq(endpoints.id, endpointId))
        .returning();
      return row;
    } catch (e) {
      if (isUniqueViolation(e)) {
        return reply.status(409).send({ error: "conflict", message: "Path trùng với endpoint khác." });
      }
      throw e;
    }
  });

  app.delete<{ Params: { endpointId: string } }>("/v1/endpoints/:endpointId", auth, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const { endpointId } = request.params;
    const rows = await db
      .select({ id: endpoints.id })
      .from(endpoints)
      .where(and(eq(endpoints.id, endpointId), eq(endpoints.userId, userId)))
      .limit(1);
    if (!rows[0]) return reply.status(404).send({ error: "not_found" });
    await db.delete(endpoints).where(eq(endpoints.id, endpointId));
    return reply.status(204).send();
  });

  app.post("/v1/preview", auth, async (request, reply) => {
    const parsed = previewBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    try {
      const q = (parsed.data.query ?? {}) as Record<string, string | string[] | undefined>;
      const { body, chaos } = generateFromConfig(parsed.data.schemaConfig, q, {
        previewStressChaos: parsed.data.previewStressChaos === true,
      });
      return { body, chaos };
    } catch (e) {
      if (e instanceof TemplateValidationError) {
        return reply.status(422).send({ error: "invalid_template", message: e.message });
      }
      if (e instanceof ZodError) {
        return reply.status(422).send({ error: "invalid_schema", details: e.flatten() });
      }
      throw e;
    }
  });
}
