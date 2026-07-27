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
      // Severity policy — read this before changing anything below.
      //
      // Every rule in this block is one the codebase VIOLATES TODAY. They are
      // warnings, not errors, for one reason: `pnpm lint` has to be able to
      // pass, or the CI gate is red from birth and everyone learns to ignore
      // it. Every rule NOT listed here stays an error, so new code cannot
      // introduce a fresh class of problem even while the backlog is open.
      //
      // These are not "rules we disagree with" — each is a real finding with a
      // count and an owner in docs/TECH_DEBT.md TD-22. Flip each to "error" as
      // its owning item lands. Do not silence one by deleting the line.
      // ---------------------------------------------------------------------

      // TD-08 step 4, closed 2026-07-27: the count reached zero, so this is an
      // error again and cannot creep back. CLAUDE.md rule 3 ("no new `any`")
      // is enforced by the linter now rather than by good intentions.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-unsafe-enum-comparison": "warn",
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/restrict-template-expressions": "warn",

      // Unhandled async work, concentrated in the maps module. These are
      // latent bugs, not style: a rejected promise here is silent. Owner: TD-22.
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/require-await": "warn",

      // Direct mutation of a value returned by a hook, once per page-manager
      // hook (`page.id = pageItem.id`). A real React correctness problem.
      // Owner: TD-22, and TD-09 when the four hooks collapse into one.
      "react-hooks/immutability": "warn",

      // `require()` in next.config.ts and tailwind.config.ts. next.config.ts
      // goes away with TD-18. Owner: TD-22.
      "@typescript-eslint/no-require-imports": "warn",

      "@typescript-eslint/unbound-method": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    },
  },

  // Plain JS files are not in the TS program, so type-aware rules cannot run on
  // them — they crash rather than report. This must come *after* the rules
  // block above, which would otherwise switch them back on for .js as well.
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Must stay last: turns off every stylistic rule Prettier owns.
  prettier
);
