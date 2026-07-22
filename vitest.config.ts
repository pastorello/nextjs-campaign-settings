import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Reads the `@/*` alias straight from tsconfig.json, so the mapping never has
  // to be duplicated the way Jest's moduleNameMapper did. Native since Vite 7;
  // the vite-tsconfig-paths plugin is no longer needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["app/**"],
      exclude: [
        "**/*.config.*",
        "**/generated/**",
        "app/seed/**",
        "**/*.d.ts",
        "app/modules/maps/components/ui/**",
      ],
      // Deliberately set to what the suite achieves today, not to the targets
      // in docs/TESTING.md §2. A threshold you have to lower to merge is worse
      // than no threshold; this one is a ratchet — raise it as TD-01, TD-02 and
      // the rest bring real tests with them. The per-area targets stay the goal.
      thresholds: {
        lines: 14,
        functions: 9,
        branches: 9,
        statements: 13,
      },
    },
  },
});
