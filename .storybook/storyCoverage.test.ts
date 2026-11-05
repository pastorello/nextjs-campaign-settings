// @vitest-environment node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { NO_UI_OF_THEIR_OWN, PENDING_STORIES } from "./pendingStories";
import { ROOT, componentFiles, storiedFiles } from "./storyCoverage";

/**
 * ADR-0021's ratchet: every UI component has a story, is a context with no UI
 * of its own, or is on TD-156's pending list — and that list only shrinks.
 */
describe("story coverage", () => {
  const components = componentFiles();
  const storied = storiedFiles();
  const exempt = new Set([...NO_UI_OF_THEIR_OWN, ...PENDING_STORIES]);

  it("finds the components (the scan is not silently empty)", () => {
    expect(components.length).toBeGreaterThan(150);
  });

  it("has a story for every new component", () => {
    const missing = components.filter(
      (file) => !storied.has(file) && !exempt.has(file)
    );
    // A component added without a story lands here. Write its story — or, for
    // a context with no UI, add it to NO_UI_OF_THEIR_OWN.
    expect(missing).toEqual([]);
  });

  it("lists as pending only components a story does not cover yet", () => {
    const covered = PENDING_STORIES.filter((file) => storied.has(file));
    // A story now covers these: delete their lines from PENDING_STORIES.
    expect(covered).toEqual([]);
  });

  it("lists only files that exist", () => {
    const gone = [...exempt].filter((file) => !existsSync(join(ROOT, file)));
    expect(gone).toEqual([]);
  });
});
