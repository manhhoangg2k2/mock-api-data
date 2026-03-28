import "./load-env.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { mockApiRoutes } from "./routes/mock-api.js";

const port = Number(process.env.PORT) || 3000;

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(mockApiRoutes);

  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Listening on http://0.0.0.0:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
