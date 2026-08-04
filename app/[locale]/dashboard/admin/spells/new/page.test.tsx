import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Representative of the admin "new item" page pattern shared by
// admin/deities/new, admin/magicitems/new and admin/npc/new: a thin client
// component wiring a domain form's cancel/save callbacks to a router.push
// back to the admin list. One domain covers the shape (TD-45).

const push = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/app/ui/spells/SpellForm", () => ({
  default: ({
    onCancel,
    onSaveFinished,
  }: {
    onCancel: () => void;
    onSaveFinished: () => void;
  }) => (
    <div>
      <button onClick={onCancel}>cancel</button>
      <button onClick={onSaveFinished}>save</button>
    </div>
  ),
}));

import Page from "./page";

describe("admin spells new Page (admin new-item page pattern)", () => {
  it("navigates back to the admin list on cancel", () => {
    render(<Page />);

    screen.getByText("cancel").click();

    expect(push).toHaveBeenCalledWith("/dashboard/admin/spells");
  });

  it("navigates back to the admin list once the save finishes", () => {
    render(<Page />);

    screen.getByText("save").click();

    expect(push).toHaveBeenCalledWith("/dashboard/admin/spells");
  });
});
