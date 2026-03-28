import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({
  connectionString,
  max: 10,
  ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: true } : undefined,
});

export const db = drizzle(pool, { schema });

export async function closePool() {
  await pool.end();
}
