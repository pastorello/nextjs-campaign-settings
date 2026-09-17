import { describe, expect, it } from "vitest";

import { dashboardPath } from "./dashboardPath";

describe("dashboardPath", () => {
  it("builds the overview path for a system", () => {
    expect(dashboardPath("dnd5e")).toBe("/dashboard/dnd5e");
  });

  it("puts the system between the dashboard and the page", () => {
    expect(dashboardPath("dnd5e", "/admin/spells")).toBe(
      "/dashboard/dnd5e/admin/spells"
    );
  });
});
