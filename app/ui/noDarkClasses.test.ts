import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join, relative } from "path";

/**
 * TD-115 — the app is consistently light until a design-system spec decides
 * on dark mode (docs/ROADMAP.md Phase 5). Tailwind's `dark:` variant follows
 * `prefers-color-scheme`, so a single reintroduced `dark:` class turns that
 * one component dark on an OS set to dark mode while the rest of the app
 * stays light — the exact bug this item fixed. This is a plain source scan,
 * not a render test: it fails the moment a `dark:` token reappears anywhere
 * under `app/ui/**`, before it ships.
 *
 * `app/modules/maps/components/**` is out of scope on purpose — it is a
 * vendored library (2026-07-22 "unused is not dead" in CLAUDE.md) and TD-115
 * only cleaned the subset of it that is actually live in the app.
 */
const UI_ROOT = join(__dirname); // app/ui
const SELF = __filename; // this file legitimately names the variant it bans

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(tsx?|css)$/.test(entry.name) && fullPath !== SELF) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("no dark: classes under app/ui", () => {
  it("stays free of Tailwind dark: variants until the design-system spec adds them back", () => {
    const offenders: string[] = [];

    for (const file of collectSourceFiles(UI_ROOT)) {
      const content = readFileSync(file, "utf-8");
      if (/\bdark:/.test(content)) {
        offenders.push(relative(process.cwd(), file));
      }
    }

    expect(offenders).toEqual([]);
  });
});
