import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@ums/domain": path.resolve(__dirname, "packages/domain/src"),
      "@ums/source-data": path.resolve(__dirname, "packages/source-data/src"),
      "@ums/audit": path.resolve(__dirname, "packages/audit/src"),
      "@ums/compliance": path.resolve(__dirname, "packages/compliance/src"),
      // zod lives in the pnpm store; resolve via the compliance package dependency chain
      "zod": path.resolve(__dirname, "node_modules/.pnpm/zod@3.25.76/node_modules/zod"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    server: {
      deps: {
        // argon2 is a native C addon installed under apps/web; must be loaded
        // as an external module rather than transformed by Vite's pipeline.
        external: ["argon2"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
