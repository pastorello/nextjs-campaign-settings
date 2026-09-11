import { getFileInfo } from "prettier";
import { describe, expect, it } from "vitest";

// TD-98: `.claude/worktrees/` holds other agent sessions' in-progress git
// worktrees. `pnpm format:check` walked into them and reported their files,
// and `prettier --write .` from the repo root would rewrite another session's
// working tree out from under it. ESLint (`eslint.config.mjs`) and Vitest
// (`vitest.config.ts`) already skip `.claude/`; tsc does too, implicitly —
// TypeScript's `**` never matches a directory whose name starts with a dot.
describe(".prettierignore", () => {
  const isIgnored = async (path: string) =>
    (await getFileInfo(path, { ignorePath: ".prettierignore" })).ignored;

  it("keeps Prettier out of other sessions' worktrees", async () => {
    expect(await isIgnored(".claude/worktrees/some-session/app/page.tsx")).toBe(
      true
    );
  });

  it("still reaches the app's own files", async () => {
    expect(await isIgnored("app/page.tsx")).toBe(false);
  });
});
