import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Repo root = the directory this config file lives in. Resolved via import.meta
// so it works whether the config is evaluated as ESM or transpiled.
const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    // Mirror the tsconfig "@/*" → repo-root alias so tests can import "@/lib/…".
    alias: {
      "@": rootDir,
    },
  },
});
