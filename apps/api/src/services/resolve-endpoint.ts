import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "../db/client.js";
import { endpoints, users } from "../db/schema.js";

/** segment = publicSlug hoặc username (backward compat khi public_slug null). */
export async function findEndpoint(urlSegment: string, pathNormalized: string) {
  const rows = await db
    .select({ endpoint: endpoints })
    .from(endpoints)
    .innerJoin(users, eq(endpoints.userId, users.id))
    .where(
      and(
        or(eq(users.publicSlug, urlSegment), and(isNull(users.publicSlug), eq(users.username, urlSegment))),
        eq(endpoints.pathNormalized, pathNormalized)
      )
    )
    .limit(1);
  return rows[0]?.endpoint ?? null;
}
