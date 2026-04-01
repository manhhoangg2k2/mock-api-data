import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { assertValidSlug } from "../util/slug.js";

const registerBody = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

function webhookToken(): string {
  return randomBytes(24).toString("hex");
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/v1/auth/register", async (request, reply) => {
    const parsed = registerBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    const { username, email, password } = parsed.data;
    try {
      assertValidSlug("username", username);
    } catch (e) {
      const err = e as Error;
      return reply.status(400).send({ error: "invalid_slug", message: err.message });
    }

    const emailNorm = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const [row] = await db
        .insert(users)
        .values({
          username,
          email: emailNorm,
          passwordHash,
          webhookToken: webhookToken(),
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
        });

      const token = await reply.jwtSign({ sub: row.id, username: row.username });
      return reply.status(201).send({
        token,
        user: { id: row.id, username: row.username, email: row.email },
      });
    } catch (e) {
      if (isUniqueViolation(e)) {
        return reply.status(409).send({ error: "conflict", message: "Username hoặc email đã tồn tại." });
      }
      throw e;
    }
  });

  app.post("/v1/auth/login", async (request, reply) => {
    const parsed = loginBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: "validation_error", details: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;
    const emailNorm = email.trim().toLowerCase();

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNorm))
      .limit(1);
    const user = rows[0];
    if (!user?.passwordHash) {
      return reply.status(401).send({ error: "invalid_credentials", message: "Sai email hoặc mật khẩu." });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return reply.status(401).send({ error: "invalid_credentials", message: "Sai email hoặc mật khẩu." });
    }

    const token = await reply.jwtSign({ sub: user.id, username: user.username });
    return reply.send({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  });

  app.get("/v1/auth/me", { onRequest: [app.authenticate] }, async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);
    const u = rows[0];
    if (!u) {
      return reply.status(404).send({ error: "not_found" });
    }
    return { user: u };
  });
}
