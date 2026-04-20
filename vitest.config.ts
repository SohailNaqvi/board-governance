import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@ums/domain": path.resolve(__dirname, "packages/domain/src"),
      "@ums/source-data": path.resolve(__dirname, "packages/source-data/src"),
      "@ums/audit": path.resolve(__dirname, "packages/audit/src"),
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
