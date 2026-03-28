import type { FastifyPluginAsync } from "fastify";
import { generateFromConfig } from "../services/generate-response.js";
import { applyLatency } from "../services/latency.js";
import { pickStatus } from "../services/status-roulette.js";
import { findEndpoint } from "../services/resolve-endpoint.js";
import { normalizeResourcePath } from "../util/path.js";

export const mockApiRoutes: FastifyPluginAsync = async (app) => {
  app.route({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    url: "/api/:username/*",
    handler: async (request, reply) => {
      const username = (request.params as { username: string }).username;
      const splat = (request.params as Record<string, string | undefined>)["*"];
      const resourcePath = normalizeResourcePath(splat);

      if (request.method === "OPTIONS") {
        reply.status(204).send();
        return;
      }

      const endpoint = await findEndpoint(username, resourcePath);
      if (!endpoint) {
        reply.status(404).send({ error: "not_found", message: "Unknown user or path." });
        return;
      }

      const allowed = endpoint.methodsAllowed.map((m) => m.toUpperCase());
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

      const query = request.query as Record<string, string | string[] | undefined>;
      const { body, chaos } = generateFromConfig(endpoint.schemaConfig, query);
      reply.header("X-DevMock-Chaos", encodeURIComponent(JSON.stringify(chaos)));
      reply.send(body);
    },
  });
};
