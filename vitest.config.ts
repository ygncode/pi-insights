import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environmentMatchGlobs: [
      ["tests/src/**", "jsdom"],
      ["tests/lib/**", "node"],
    ],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "src/utils.ts"],
      exclude: ["lib/types.ts"],
    },
  },
});
