import { beforeEach, describe, expect, it, vi } from "vitest";

const requireDmPage = vi.fn(() => Promise.resolve());
vi.mock("@/app/lib/auth/requireDmPage", () => ({
  default: () => requireDmPage(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import AdminLayout from "./admin/layout";
import CampaignLayout from "./campaign/layout";
import WorldLayout from "./world/layout";
import TreasuresLayout from "./treasures/layout";

const params = Promise.resolve({ locale: "it", system: "dnd5e" });

// SPEC-022 R15: the sections only the DM sees keep `requireDmPage` as the
// second layer behind the proxy, now that the dashboard layout lets a
// player in (T7).
describe.each([
  ["admin", AdminLayout],
  ["campaign", CampaignLayout],
  ["world", WorldLayout],
  ["treasures", TreasuresLayout],
])("the %s layout", (_, Layout) => {
  beforeEach(() => {
    requireDmPage.mockClear();
  });

  it("renders its page for the DM", async () => {
    const children = <p>page</p>;

    await expect(Layout({ children, params })).resolves.toBe(children);
    expect(requireDmPage).toHaveBeenCalledOnce();
  });

  it("stops at the guard's refusal", async () => {
    requireDmPage.mockImplementationOnce(() =>
      Promise.reject(new Error("NEXT_HTTP_ERROR_FALLBACK;403"))
    );

    await expect(Layout({ children: <p>page</p>, params })).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;403"
    );
  });
});
