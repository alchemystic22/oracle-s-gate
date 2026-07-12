import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/ritual-engine/__tests__/**/*.test.ts"],
  },
});
