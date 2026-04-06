import fs from "node:fs";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(srcDir, "..");

const monorepoRoot = path.resolve(apiDir, "..", "..");

const candidateEnvPaths = [
  path.join(monorepoRoot, ".env"),
  path.join(apiDir, ".env"),
  path.join(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", "..", ".env"),
];

const uniquePaths = [...new Set(candidateEnvPaths)];

for (const p of uniquePaths) {
  if (fs.existsSync(p)) {
    config({ path: p, override: true });
  }
}
