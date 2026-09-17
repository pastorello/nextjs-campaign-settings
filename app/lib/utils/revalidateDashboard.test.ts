import { describe, expect, it, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { revalidateDashboard } from "./revalidateDashboard";

describe("revalidateDashboard (TD-105)", () => {
  it("revalidates the page at the route's real file location, not the browser URL", () => {
    revalidateDashboard("geography");

    expect(revalidatePath).toHaveBeenCalledWith(
      "/[locale]/dashboard/[system]/geography",
      "page"
    );
  });

  it("always passes type: 'page', required because the path has a dynamic segment", () => {
    revalidateDashboard("campaign");

    expect(revalidatePath).toHaveBeenCalledWith(expect.any(String), "page");
  });

  it.each([
    "campaign",
    "deities",
    "factions",
    "geography",
    "magicitems",
    "npc",
    "spells",
    "treasures",
    "world",
  ] as const)("builds the path for domain %s", (domain) => {
    revalidateDashboard(domain);

    expect(revalidatePath).toHaveBeenCalledWith(
      `/[locale]/dashboard/[system]/${domain}`,
      "page"
    );
  });
});
