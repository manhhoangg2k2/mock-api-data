import fs from "node:fs";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const apiDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * `apiDir` = `code/apps/api` → `../../.env` = `code/.env` (đúng monorepo).
 * Không dùng `../.env` (sẽ thành `code/apps/.env` — sai).
 */
const envFilesRaw = [
  path.resolve(apiDir, "../../.env"),
  path.resolve(apiDir, ".env"),
  path.resolve(process.cwd(), ".env"),
];

const seen = new Set<string>();
const envFiles = envFilesRaw.filter((p) => {
  const n = path.normalize(p);
  if (seen.has(n)) return false;
  seen.add(n);
  return true;
});

for (const p of envFiles) {
  if (fs.existsSync(p)) {
    config({ path: p });
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error(
    [
      "DATABASE_URL is not set.",
      "Add DATABASE_URL to one of these files (dotenv loads in order; first file wins per key):",
      ...envFiles.map((p) => `  - ${p}`),
      "Or run: export DATABASE_URL='postgresql://...' && pnpm db:push",
    ].join("\n")
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
