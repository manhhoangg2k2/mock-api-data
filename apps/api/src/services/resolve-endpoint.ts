import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { endpoints, users } from "../db/schema.js";

export async function findEndpoint(username: string, pathNormalized: string) {
  const rows = await db
    .select({ endpoint: endpoints })
    .from(endpoints)
    .innerJoin(users, eq(endpoints.userId, users.id))
    .where(and(eq(users.username, username), eq(endpoints.pathNormalized, pathNormalized)))
    .limit(1);
  return rows[0]?.endpoint ?? null;
}
