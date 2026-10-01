import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const sideNav = vi.fn();
vi.mock("@/app/ui/dashboard/sidenav", () => ({
  default: ({ viewer }: { viewer: unknown }) => {
    sideNav(viewer);
    return <nav data-testid="sidenav" />;
  },
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const dm = { kind: "dm", userId: "1" };
const getViewer = vi.fn<() => Promise<unknown>>(() => Promise.resolve(dm));
vi.mock("@/app/lib/auth/getViewer", () => ({
  default: () => getViewer(),
}));

const redirect = vi.fn<(...args: unknown[]) => void>();
vi.mock("@/i18n/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import Layout from "./layout";

async function renderLayout(system: string) {
  const ui = await Layout({
    params: Promise.resolve({ locale: "it", system }),
    children: <p>page content</p>,
  });
  return render(ui);
}

describe("dashboard Layout", () => {
  it("renders the side nav alongside its children for a known system", async () => {
    await renderLayout("dnd5e");

    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("is a 404 for a system that is not in GAME_SYSTEMS (ADR-0013 rule 2)", async () => {
    await expect(renderLayout("foo")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  // SPEC-022 T7: a player reads part of the dashboard too; which part is
  // the proxy's to decide. Without a session the layout signs them out.
  it("sends a request without a session to the login page", async () => {
    getViewer.mockResolvedValueOnce(null);

    await renderLayout("dnd5e");

    expect(redirect).toHaveBeenCalledWith({ href: "/login", locale: "it" });
    expect(screen.queryByText("page content")).not.toBeInTheDocument();
  });

  // SPEC-022 §8: another system's pages are a 404 for a player.
  it("is a 404 for a player under a system none of their campaigns plays", async () => {
    getViewer.mockResolvedValueOnce({
      kind: "player",
      userId: "2",
      campaigns: [{ id: 1, title: "Marea", system: "daggerheart" }],
      campaign: { id: 1, title: "Marea", system: "daggerheart" },
    });

    await expect(renderLayout("dnd5e")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("lets a player in no campaign read either system", async () => {
    getViewer.mockResolvedValueOnce({
      kind: "player",
      userId: "2",
      campaigns: [],
      campaign: null,
    });

    await renderLayout("daggerheart");

    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders the dashboard for a player, handing the side nav the viewer", async () => {
    const player = {
      kind: "player",
      userId: "2",
      campaigns: [],
      campaign: null,
    };
    getViewer.mockResolvedValueOnce(player);

    await renderLayout("dnd5e");

    expect(screen.getByText("page content")).toBeInTheDocument();
    expect(sideNav).toHaveBeenLastCalledWith(player);
  });

  // TD-88: the sidebar's own column now scrolls (see sidenav.test.tsx), but
  // the page-level column must still not — only the content pane does.
  it("keeps the page-level column from scrolling; only the content pane does", async () => {
    const { container } = await renderLayout("dnd5e");

    const pageColumn = container.firstElementChild;
    expect(pageColumn).toHaveClass("md:overflow-hidden");

    const contentPane = screen.getByText("page content").parentElement;
    expect(contentPane).toHaveClass("md:overflow-y-auto");
  });
});
