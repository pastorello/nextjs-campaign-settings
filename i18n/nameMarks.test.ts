import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import it_ from "@/messages/it.json";

/**
 * SPEC-018 §5.3 (DPCGL §2.5) and the 5e and PF2 trademark notes: a system's
 * name may label the system, and Daggerheart's may appear in the descriptive
 * "Daggerheart™ Compatible", but no system names the app. The app's title
 * is the page `<title>` template and the brand in both catalogues.
 */
const SYSTEM_NAMES = /daggerheart|pathfinder|d&d|dungeons/i;

describe("the app's title names no game system (SPEC-018 §5.3)", () => {
  it.each([
    ["it", it_],
    ["en", en],
  ])("the %s brand", (_locale, messages) => {
    expect(messages.common.brand.name).not.toMatch(SYSTEM_NAMES);
  });

  it("the page title template and default", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "app", "[locale]", "layout.tsx"),
      "utf-8"
    );
    const title = /title:\s*\{([^}]*)\}/.exec(layout)?.[1];
    expect(title).toBeDefined();
    expect(title).toMatch(/template:/);
    expect(title).not.toMatch(SYSTEM_NAMES);
  });

  it("uses the licence's descriptive form where Daggerheart is named", () => {
    for (const messages of [it_, en]) {
      expect(messages.gameSystemCompatibility.daggerheart).toBe(
        "Daggerheart™ Compatible"
      );
    }
  });
});
