import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import Layout from "./layout";

// Representative of the six catalogue layouts (spells, magicitems,
// treasures, and their admin/ twins): each is this one call with its own
// PageType, whose logic assertPageSystem's own test covers.
function run(system: string) {
  return Layout({
    params: Promise.resolve({ locale: "it", system }),
    children: "page",
  });
}

describe("spells Layout", () => {
  it("renders the page under the 5e system", async () => {
    await expect(run("dnd5e")).resolves.toBe("page");
  });

  it("is a 404 under another system", async () => {
    await expect(run("daggerheart")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
