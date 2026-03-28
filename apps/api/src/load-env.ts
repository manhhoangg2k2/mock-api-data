import fs from "node:fs";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(srcDir, "..");

const envFiles = [
  path.resolve(srcDir, "../../../.env"), // code/.env
  path.resolve(apiDir, ".env"), // apps/api/.env
  path.resolve(process.cwd(), ".env"),
];

for (const p of envFiles) {
  if (fs.existsSync(p)) {
    config({ path: p });
  }
}
