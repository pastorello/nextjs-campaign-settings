import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("@/app/ui/dashboard/cards", () => ({
  default: () => <div data-testid="card-wrapper" />,
}));

import Page, { dynamic } from "./page";

describe("dashboard overview Page", () => {
  it("is force-dynamic, so the live counts are never build-time frozen", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders the title and the record-count cards", async () => {
    render(await Page());

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByTestId("card-wrapper")).toBeInTheDocument();
  });
});
