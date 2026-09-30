import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("@/app/ui/dashboard/SignOutButton", () => ({
  default: () => <button type="submit">signOut</button>,
}));

import Forbidden from "./forbidden";

describe("Forbidden (SPEC-022)", () => {
  it("says the page is not this account's, and offers the way out", async () => {
    render(await Forbidden());

    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "signOut" })).toBeInTheDocument();
  });
});
