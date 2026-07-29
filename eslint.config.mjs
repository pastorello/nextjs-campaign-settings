import next from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "generated/**",
      "node_modules/**",
      "coverage/**",
      "public/**",
      // Agent worktrees are whole checkouts of this repo living under
      // .claude/worktrees/. Without this, `pnpm lint` reports every finding
      // twice over and exits non-zero on a copy nobody is editing.
      ".claude/**",
      "next-env.d.ts",
      "*.tsbuildinfo",
    ],
  },

  // React, hooks, imports, jsx-a11y and the Next-specific rules. jsx-a11y ships
  // inside this config, so TD-05's "add eslint-plugin-jsx-a11y" is already met.
  ...next,

  // Type-aware linting. `projectService` lets typescript-eslint resolve the
  // right tsconfig per file without listing them here.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      // Unused locals, params and imports are an error — the codebase passes
      // this today. A leading `_` exempts a parameter that a signature forces
      // (Next route handlers are `(request, context)` even when only one is
      // read). WorldMap.tsx and the vendored maps module keep unwired
      // scaffolding on purpose and opt out with a file-level disable comment
      // (see CLAUDE.md, "unused is not dead").
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "after-used", argsIgnorePattern: "^_" },
      ],

      // ---------------------------------------------------------------------
      // Former severity-policy block (TD-22, closed 2026-07-29).
      //
      // Every rule below was a warning rather than an error for one reason:
      // `pnpm lint` had to be able to pass while the codebase still violated
      // it, or the CI gate would be red from birth. TD-22 tracked each one to
      // zero (see docs/TECH_DEBT.md) and they are back to "error" now, so a
      // regression here is a compile-time failure rather than a silent
      // re-accumulation. Left listed explicitly, rather than relying on
      // `recommendedTypeChecked`'s defaults, so the next person doesn't have
      // to guess which rules this project cares about enforcing.
      // ---------------------------------------------------------------------
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",
      "@typescript-eslint/no-base-to-string": "error",
      "@typescript-eslint/restrict-template-expressions": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/require-await": "error",
      "react-hooks/immutability": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
    },
  },

  // Plain JS files are not in the TS program, so type-aware rules cannot run on
  // them — they crash rather than report. This must come *after* the rules
  // block above, which would otherwise switch them back on for .js as well.
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // `vi.mocked(prisma.spells.findUnique)` and `expect(prisma.spells.delete)`
  // tear a method off its object, which is exactly what `unbound-method`
  // exists to catch — for a *real* class instance, losing that receiver loses
  // `this`. Here the receiver is a `vi.mock()` stub: at runtime it is a plain
  // `vi.fn()` with no `this`-dependency, but its type still comes from the
  // real Prisma/NextAuth client, so the checker can't tell the difference.
  // Scoped to __test__/ rather than fixed case by case, because every new
  // mocked-delegate assertion hits the same false positive. TD-22.
  {
    files: ["__test__/**"],
    rules: {
      "@typescript-eslint/unbound-method": "off",
    },
  },

  // Must stay last: turns off every stylistic rule Prettier owns.
  prettier
);
