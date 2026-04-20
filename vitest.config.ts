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
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
