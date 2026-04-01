import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }
  return "dev-insecure-jwt-secret-change-me";
}

export async function registerJwtAuth(app: FastifyInstance) {
  const secret = jwtSecret();
  if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
    app.log.warn("JWT_SECRET not set — using dev default (do not use in production)");
  }

  await app.register(jwt, {
    secret,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
  });

  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({ error: "unauthorized", message: "Token không hợp lệ hoặc hết hạn." });
      }
    }
  );
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
