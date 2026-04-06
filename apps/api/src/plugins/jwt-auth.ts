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

  const accessTtl = process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? "15m";

  await app.register(jwt, {
    secret,
    sign: { expiresIn: accessTtl },
  });

  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
        const u = request.user as { sub?: string; typ?: string };
        if (u?.typ === "refresh") {
          return reply.status(401).send({
            error: "unauthorized",
            message: "Dùng access token cho API này, không dùng refresh token.",
          });
        }
      } catch {
        return reply.status(401).send({ error: "unauthorized", message: "Token không hợp lệ hoặc hết hạn." });
      }
    }
  );
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
