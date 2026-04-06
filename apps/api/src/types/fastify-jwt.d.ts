import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; username?: string; typ?: "access" | "refresh" };
  }
}
