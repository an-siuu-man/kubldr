// ESM config file (.mts) — required because Next.js 16 projects don't set
// "type": "module" in package.json, so .ts config files are loaded as CJS,
// which conflicts with ESM-only dependencies inside Vitest 4.x.
// Always reference this file via the --config flag in package.json scripts.

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**/*.ts",
        "src/app/api/**/*.ts",
        "src/contexts/**/*.tsx",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.d.ts"],
      reporter: ["text", "html", "lcov"],
    },
    exclude: ["node_modules", ".next", "dist"],
  },
});
