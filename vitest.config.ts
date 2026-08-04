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
    // `.claude/**` holds agent worktrees — full checkouts of this repo. Without
    // excluding them the suite collects every test twice, which inflates both
    // the test count and the coverage ratchet against a copy nobody is editing.
    exclude: [
      "**/node_modules/**",
      "**/e2e/**",
      "**/.next/**",
      "**/.claude/**",
    ],
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
      // No `all: true` here — Vitest 4's v8 provider (this repo runs 4.1.10)
      // removed the option because instrumenting every `include`d file,
      // touched by a test or not, is now unconditional default behaviour.
      // Confirmed 2026-08-02 (TD-44): setting `all: true` on Vitest 3 first
      // produced the same totals either way, then failed `tsc` outright once
      // upgraded, because the property no longer exists on `CoverageOptions`.
      // There is no blind spot left to remove — this file list already is
      // the whole `app/**` tree.
      //
      // Deliberately set to what the suite achieves today, not to the targets
      // in docs/TESTING.md §2. A threshold you have to lower to merge is worse
      // than no threshold; this one is a ratchet — raise it whenever a change
      // adds real coverage. Re-measured 2026-08-02 (TD-44).
      // Raised from 50/50/47/50 after TD-45 (page-level route components,
      // 2026-08-04): the suite now measures 54.51/53.77/48.92/54.22.
      // Raised again from 54/53/48/54 after TD-46's Tier 1 Vitest suites
      // (2026-08-04): LeafletMap, MapContextMenu, MapMeasurementPanel,
      // MapControls, MapPOIPanel — the maps components WorldMap.tsx actually
      // renders — went from 0% to real coverage; the suite now measures
      // 63.81/63.54/60.89/64.72.
      thresholds: {
        lines: 63,
        functions: 64,
        branches: 60,
        statements: 63,
      },
    },
  },
});
