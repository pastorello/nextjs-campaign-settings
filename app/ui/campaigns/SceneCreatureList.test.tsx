import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SceneCreatureWithAdversary } from "@/app/lib/data/campaigns/fetchAdventureWithScenes";

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
      const full = namespace ? `${namespace}.${key}` : key;
      return values ? `${full} ${JSON.stringify(values)}` : full;
    },
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
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

// SPEC-031: the NPC page link is built for the route's dashboard.
vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

const reorderSceneCreatures = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/reorderSceneCreatures", () => ({
  default: (...args: unknown[]) => reorderSceneCreatures(...args),
}));

const deleteSceneCreatureById = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/deleteSceneCreatureById", () => ({
  default: (...args: unknown[]) => deleteSceneCreatureById(...args),
}));

const setSceneCreatureAwarded = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/setSceneCreatureAwarded", () => ({
  default: (...args: unknown[]) => setSceneCreatureAwarded(...args),
}));

const notifySuccess = vi.fn<(...args: unknown[]) => void>();
const notifyError = vi.fn<(...args: unknown[]) => void>();
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: (...args: unknown[]) => notifySuccess(...args),
  notifyError: (...args: unknown[]) => notifyError(...args),
}));

vi.mock("./SceneCreatureForm", () => ({
  default: ({ onSaved }: { onSaved: () => void }) => (
    <button onClick={onSaved} data-testid="creature-form">
      save-stub
    </button>
  ),
}));

import SceneCreatureList from "./SceneCreatureList";

const goblins = {
  id: 1,
  sceneId: 1,
  position: 1,
  name: "Goblins",
  level: 1,
  xpEach: 50,
  quantity: 4,
  note: null,
  awarded: false,
  npcId: null,
};

const boss = {
  ...goblins,
  id: 2,
  position: 2,
  name: "Goblin boss",
  quantity: 1,
  xpEach: null,
};

describe("SceneCreatureList (SPEC-013 T8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the derived XP total (xpEach * quantity) and '—' when xpEach is unset", () => {
    render(
      <SceneCreatureList
        sceneId={1}
        creatures={[goblins, boss]}
        npcOptions={[]}
      />
    );

    expect(
      screen.getByText(/sceneCreature.list.xpTotal: 200/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sceneCreature.list.xpTotal: —/)
    ).toBeInTheDocument();
  });

  it("reorders by swapping with the next creature and refreshes", async () => {
    reorderSceneCreatures.mockResolvedValue({ ok: true });
    render(
      <SceneCreatureList
        sceneId={1}
        creatures={[goblins, boss]}
        npcOptions={[]}
      />
    );

    fireEvent.click(screen.getAllByLabelText(/moveDown/)[0]!);

    await waitFor(() =>
      expect(reorderSceneCreatures).toHaveBeenCalledWith(1, [2, 1])
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("catches a thrown reorder failure instead of leaving it unhandled (TD-125)", async () => {
    reorderSceneCreatures.mockRejectedValue(new Error("database unreachable"));
    render(
      <SceneCreatureList
        sceneId={1}
        creatures={[goblins, boss]}
        npcOptions={[]}
      />
    );

    fireEvent.click(screen.getAllByLabelText(/moveDown/)[0]!);

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("common.reorder.failed")
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("deletes a creature after confirmation and refreshes", async () => {
    deleteSceneCreatureById.mockResolvedValue(undefined);
    render(
      <SceneCreatureList sceneId={1} creatures={[goblins]} npcOptions={[]} />
    );

    fireEvent.click(screen.getByText("common.form.delete"));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("common.form.delete"));

    await waitFor(() =>
      expect(deleteSceneCreatureById).toHaveBeenCalledWith(1)
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("shows and hides the add-creature form", () => {
    render(<SceneCreatureList sceneId={1} creatures={[]} npcOptions={[]} />);

    expect(screen.queryByTestId("creature-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("sceneCreature.list.addButton"));
    expect(screen.getByTestId("creature-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("creature-form"));
    expect(screen.queryByTestId("creature-form")).not.toBeInTheDocument();
  });

  it("checks off a creature as awarded, independently per creature", async () => {
    setSceneCreatureAwarded.mockResolvedValue({ ok: true });
    render(
      <SceneCreatureList
        sceneId={1}
        creatures={[goblins, { ...boss, awarded: true }]}
        npcOptions={[]}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toHaveAttribute("aria-checked", "false");
    expect(checkboxes[1]).toHaveAttribute("aria-checked", "true");

    fireEvent.click(checkboxes[0]!);

    await waitFor(() =>
      expect(setSceneCreatureAwarded).toHaveBeenCalledWith(1, true)
    );
    expect(setSceneCreatureAwarded).not.toHaveBeenCalledWith(
      2,
      expect.anything()
    );
    expect(refresh).toHaveBeenCalled();
  });

  // SPEC-030 T3: a Daggerheart row is priced in Battle Points.
  it("prices a Daggerheart row in Battle Points, and an unlinked one not at all", () => {
    render(
      <SceneCreatureList
        rulesSystem="daggerheart"
        sceneId={1}
        creatures={[
          {
            ...goblins,
            quantity: 3,
            dhAdversaryId: 7,
            dhAdversary: { name: "Lurker", adversaryType: "standard", tier: 1 },
          },
          { ...boss, dhAdversaryId: null, dhAdversary: null },
        ]}
        npcOptions={[]}
        partySize={4}
      />
    );

    expect(
      screen.getByText("sceneCreature.list.battlePoints: 6")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "sceneCreature.list.battlePoints: sceneCreature.list.unpriced"
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/sceneCreature.list.xpTotal/)).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});

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
