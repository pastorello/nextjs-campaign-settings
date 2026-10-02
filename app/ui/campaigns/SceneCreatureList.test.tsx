import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SceneCreatureWithAdversary } from "@/app/lib/data/campaigns/fetchAdventureWithScenes";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));
vi.mock("@/app/lib/data/campaigns/reorderSceneCreatures", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/campaigns/deleteSceneCreatureById", () => ({
  default: vi.fn(),
}));
vi.mock("@/app/lib/data/campaigns/setSceneCreatureAwarded", () => ({
  default: vi.fn(),
}));

vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));
// The form's Server Actions reach `auth`; the row is what is under test.
vi.mock("./SceneCreatureForm", () => ({ default: () => null }));

import SceneCreatureList from "./SceneCreatureList";

// Invented content only (SPEC-018 §5).
const row = (
  overrides: Partial<SceneCreatureWithAdversary>
): SceneCreatureWithAdversary => ({
  id: 1,
  sceneId: 3,
  position: 1,
  name: "Lantern wraith",
  level: null,
  xpEach: 450,
  quantity: 2,
  note: null,
  awarded: false,
  npcId: null,
  statsUrl: null,
  challengeRating: null,
  ...overrides,
});

const renderList = (
  creatures: SceneCreatureWithAdversary[],
  rulesSystem: "dnd5e" | "daggerheart" = "dnd5e"
) =>
  render(
    <SceneCreatureList
      sceneId={3}
      creatures={creatures}
      rulesSystem={rulesSystem}
      npcOptions={[{ value: 9, label: "Mirela the ferrywoman" }]}
    />
  );

describe("SceneCreatureList — statistics, NPC page and CR (SPEC-031 T3)", () => {
  it("links the statistics in a new tab, as a plain anchor", () => {
    renderList([row({ statsUrl: "https://example.com/bestiary/wraith" })]);

    const link = screen.getByRole("link", {
      name: /sceneCreature\.list\.statsLinkLabel/,
    });
    expect(link).toHaveAttribute("href", "https://example.com/bestiary/wraith");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links a row's NPC to the NPC's page, in the same tab", () => {
    renderList([row({ npcId: 9 })]);

    const link = screen.getByRole("link", {
      name: /sceneCreature\.list\.npcLinkLabel.*Mirela the ferrywoman/,
    });
    expect(link.getAttribute("href")).toMatch(
      /^\/dashboard\/dnd5e\/npc\?query=Mirela/
    );
    expect(link).not.toHaveAttribute("target");
  });

  it("shows no links on a row with neither", () => {
    renderList([row({})]);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows a 5e row's CR, and none on a Daggerheart row", () => {
    const { unmount } = renderList([row({ challengeRating: "1/8" })]);
    expect(
      screen.getByText(/sceneCreature\.list\.challengeRating\s+1\/8/)
    ).toBeInTheDocument();
    unmount();

    renderList(
      [row({ challengeRating: "1/8", statsUrl: "https://example.com/x" })],
      "daggerheart"
    );
    expect(
      screen.queryByText(/sceneCreature\.list\.challengeRating/)
    ).not.toBeInTheDocument();
    // The statistics link is any system's.
    expect(
      screen.getByRole("link", { name: /sceneCreature\.list\.statsLinkLabel/ })
    ).toBeInTheDocument();
  });
});
