import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["convex/**/*.test.ts"],
    testTimeout: 10000,
    setupFiles: ["./convex/test.vitest-setup.ts"],
  },
});
