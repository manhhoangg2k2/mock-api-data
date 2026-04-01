import "../load-env.js";
import { eq } from "drizzle-orm";
import { db, closePool } from "./client.js";
import { endpoints, projects, users } from "./schema.js";

const DEMO_WEBHOOK_TOKEN = "demo-wh-secret";

const demoSchema = {
  responseShape: "object" as const,
  fields: [
    { key: "id", type: "string" as const, faker: "uuid" },
    { key: "name", type: "string" as const, faker: "fullName" },
    {
      key: "email",
      type: "string" as const,
      faker: "email",
      chaos: { omitPercent: 2, nullPercent: 3, edgePercent: 8, edgePreset: "email_bad" },
    },
    {
      key: "balance",
      type: "number" as const,
      faker: "financeAmount",
      chaos: { edgePercent: 5, edgePreset: "negative_money" },
    },
  ],
  virtualPagination: { enabled: true, totalCount: 1_000_000 },
};

async function main() {
  const existing = await db.select().from(users).where(eq(users.username, "demo")).limit(1);
  if (existing.length > 0) {
    console.log("Seed skipped: user `demo` already exists.");
    await closePool();
    return;
  }

  const [u] = await db
    .insert(users)
    .values({
      username: "demo",
      email: null,
      passwordHash: null,
      webhookToken: DEMO_WEBHOOK_TOKEN,
    })
    .returning();

  const [p] = await db
    .insert(projects)
    .values({
      userId: u.id,
      name: "Demo project",
      slug: "default",
    })
    .returning();

  await db.insert(endpoints).values({
    projectId: p.id,
    userId: u.id,
    pathNormalized: "v1/users",
    methodsAllowed: ["GET", "POST", "OPTIONS"],
    schemaConfig: demoSchema,
    latencyMsMin: 0,
    latencyMsMax: 50,
    statusRoulette: { "200": 92, "500": 5, "401": 3 },
  });

  console.log("Seeded user `demo`, endpoint `v1/users`.");
  console.log(`Try: GET http://localhost:${process.env.PORT ?? 3000}/api/demo/v1/users`);
  await closePool();
}

main().catch(async (e) => {
  console.error(e);
  await closePool();
  process.exit(1);
});
