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
    // Mirrors the CI job env (`.github/workflows/ci.yml`) so `pnpm test` is
    // green on a fresh checkout with no `.env` file. `env.ts` validates
    // `DATABASE_URL` at import time (TD-02b), and this is the only value
    // that reaches it here — no real database is touched by unit tests. (TD-75)
    env: {
      DATABASE_URL: "postgresql://admin:postgres@localhost:5432/placeholder",
    },
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
      // Raised again from 63/64/60/63 after TD-46's Tier 2 (2026-08-04):
      // the remaining unreached maps/components/map/** tree (MapSearchBar,
      // MapDetailsPanel, MapTileSwitcher, MapThemeSwitcher, MapUser,
      // MapTopBar, LeafletGeoJSON, LeafletTileLayer) tested as-is per the
      // "vendored library stays as inventory" rule in CLAUDE.md rather than
      // wired into WorldMap.tsx or deleted — the suite now measures
      // 70.09/71.57/69.66/69.87. This crosses docs/ROADMAP.md's Phase 2
      // exit criterion (coverage above 70%).
      // Ratcheted 2026-08-13, after an audit found the gate had not moved
      // since the line above set it while the suite kept growing: the run
      // measured 74.26/75.34/74.04/73.91 against thresholds of 70/71/69/69,
      // roughly 4–5 points of slack in every dimension. That much headroom
      // is a gate that has stopped gating — coverage could fall by a twentieth
      // of the codebase before CI said anything. No test was written for this
      // change; it only freezes ground already held (SPEC-009's three tasks
      // and the TD-45/TD-46 sweeps are what actually earned it).
      //
      // Floored to the integer below each measurement, as every previous
      // raise here did — except `branches`. Flooring 74.04 would leave a
      // margin of 0.04%, under one branch out of 2269, so an unrelated PR
      // adding a single uncovered `if` would fail CI on noise. A ratchet that
      // cries wolf gets lowered by the next person in a hurry, which is worse
      // than one point of slack; it takes 73.
      thresholds: {
        lines: 74,
        functions: 75,
        branches: 73,
        statements: 73,
      },
    },
  },
});
