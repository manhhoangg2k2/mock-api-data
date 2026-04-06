import "./load-env.js";
import { sql } from "drizzle-orm";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { db } from "./db/client.js";
import { registerJwtAuth } from "./plugins/jwt-auth.js";
import { registerAuthRoutes } from "./routes/auth-routes.js";
import { registerMetaRoutes } from "./routes/meta-routes.js";
import { mockApiRoutes } from "./routes/mock-api.js";
import { guestMockRoutes } from "./routes/guest-mock.js";
import { registerV1DashboardRoutes } from "./routes/v1-dashboard.js";

const port = Number(process.env.PORT) || 3000;

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.get("/health", async () => ({ ok: true }));

  await registerMetaRoutes(app);

  await registerJwtAuth(app);
  await registerAuthRoutes(app);
  await registerV1DashboardRoutes(app);
  await app.register(mockApiRoutes);
  await app.register(guestMockRoutes);

  try {
    await db.execute(sql`select 1`);
    app.log.info("Database pool warmed");
  } catch (e) {
    app.log.warn({ err: e }, "Database warm-up failed; first request may be slower");
  }

  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Listening on http://0.0.0.0:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
