import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";
import type { SceneWithDetails } from "@/app/lib/data/campaigns/fetchAdventureWithScenes";

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

vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

const reorderScenes = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/reorderScenes", () => ({
  default: (...args: unknown[]) => reorderScenes(...args),
}));

const deleteSceneById = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/deleteSceneById", () => ({
  default: (...args: unknown[]) => deleteSceneById(...args),
}));

const setSceneAwarded = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/setSceneAwarded", () => ({
  default: (...args: unknown[]) => setSceneAwarded(...args),
}));

const notifySuccess = vi.fn<(...args: unknown[]) => void>();
const notifyError = vi.fn<(...args: unknown[]) => void>();
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: (...args: unknown[]) => notifySuccess(...args),
  notifyError: (...args: unknown[]) => notifyError(...args),
}));

vi.mock("./SceneForm", () => ({
  default: ({ onSaved }: { onSaved: () => void }) => (
    <button onClick={onSaved} data-testid="scene-form">
      save-stub
    </button>
  ),
}));

vi.mock("./SceneCreatureList", () => ({
  default: () => <div data-testid="creature-list" />,
}));

vi.mock("./LootList", () => ({
  default: () => <div data-testid="loot-list" />,
}));

import SceneList from "./SceneList";
import EncounterAdjustmentsProvider from "./EncounterAdjustmentsProvider";

const zoneOptions = [{ value: 5, label: "The Sunken Keep" }];

function makeScene(overrides: Partial<SceneWithDetails>): SceneWithDetails {
  return {
    id: 1,
    adventureId: 1,
    position: 1,
    kind: SceneKind.Fight,
    title: "A scene",
    description: null,
    xpAward: null,
    grantsHeroPoint: false,
    awarded: false,
    zoneId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    creatures: [],
    loot: [],
    ...overrides,
  };
}

const baseProps = {
  adventureId: 1,
  currencyUnit: "silver" as const,
  zoneOptions,
  npcOptions: [],
  magicItemOptions: [],
  treasureOptions: [],
};

describe("SceneList (SPEC-013 T8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders every one of the six scene kinds", () => {
    const kinds = Object.values(SceneKind);
    const scenes = kinds.map((kind, index) =>
      makeScene({
        id: index + 1,
        position: index + 1,
        kind,
        title: `Scene ${kind}`,
      })
    );

    render(<SceneList {...baseProps} scenes={scenes} />);

    kinds.forEach((kind) => {
      expect(screen.getByText(`scene.kinds.${kind}`)).toBeInTheDocument();
    });
  });

  it("links a scene's place to its map when set, by zone id", () => {
    const scenes = [makeScene({ id: 1, zoneId: 5, title: "Assigned scene" })];

    render(<SceneList {...baseProps} scenes={scenes} />);

    const link = screen.getByRole("link", { name: "The Sunken Keep" });
    expect(link).toHaveAttribute("href", "/dashboard/dnd5e/geography?place=5");
  });

  it("renders an explicit unassigned state when a scene has no place", () => {
    const scenes = [
      makeScene({ id: 1, zoneId: null, title: "Unassigned scene" }),
    ];

    render(<SceneList {...baseProps} scenes={scenes} />);

    expect(screen.getByText("scene.place.unassigned")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /geography/ })
    ).not.toBeInTheDocument();
  });

  it("shows the empty message and no scenes when there are none", () => {
    render(<SceneList {...baseProps} scenes={[]} />);

    expect(screen.getByText("scene.list.emptyMessage")).toBeInTheDocument();
  });

  it("reorders by swapping with the next scene and refreshes", async () => {
    reorderScenes.mockResolvedValue({ ok: true });
    const scenes = [
      makeScene({ id: 1, position: 1, title: "First" }),
      makeScene({ id: 2, position: 2, title: "Second" }),
    ];

    render(<SceneList {...baseProps} scenes={scenes} />);

    fireEvent.click(screen.getAllByLabelText(/moveDown/)[0]!);

    await waitFor(() => expect(reorderScenes).toHaveBeenCalledWith(1, [2, 1]));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the reorder-specific error, not the delete one, when the action refuses", async () => {
    reorderScenes.mockResolvedValue({
      ok: false,
      errors: { orderedIds: ["mismatch"] },
    });
    const scenes = [
      makeScene({ id: 1, position: 1, title: "First" }),
      makeScene({ id: 2, position: 2, title: "Second" }),
    ];

    render(<SceneList {...baseProps} scenes={scenes} />);

    fireEvent.click(screen.getAllByLabelText(/moveDown/)[0]!);

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("common.reorder.failed")
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("catches a thrown reorder failure instead of leaving it unhandled (TD-125)", async () => {
    reorderScenes.mockRejectedValue(new Error("database unreachable"));
    const scenes = [
      makeScene({ id: 1, position: 1, title: "First" }),
      makeScene({ id: 2, position: 2, title: "Second" }),
    ];

    render(<SceneList {...baseProps} scenes={scenes} />);

    fireEvent.click(screen.getAllByLabelText(/moveDown/)[0]!);

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("common.reorder.failed")
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("deletes a scene after confirmation and refreshes", async () => {
    deleteSceneById.mockResolvedValue(undefined);
    const scenes = [makeScene({ id: 1, title: "Doomed scene" })];

    render(<SceneList {...baseProps} scenes={scenes} />);

    fireEvent.click(screen.getByText("common.form.delete"));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("common.form.delete"));

    await waitFor(() => expect(deleteSceneById).toHaveBeenCalledWith(1));
    expect(refresh).toHaveBeenCalled();
  });

  it("checks off a scene as awarded, independently per scene, by keyboard", async () => {
    setSceneAwarded.mockResolvedValue({ ok: true });
    const scenes = [
      makeScene({ id: 1, title: "First", awarded: false }),
      makeScene({ id: 2, title: "Second", awarded: true }),
    ];

    render(<SceneList {...baseProps} scenes={scenes} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toHaveAttribute("aria-checked", "false");
    expect(checkboxes[1]).toHaveAttribute("aria-checked", "true");

    checkboxes[0]!.focus();
    fireEvent.keyUp(checkboxes[0]!, { key: " " });

    await waitFor(() => expect(setSceneAwarded).toHaveBeenCalledWith(1, true));
    expect(setSceneAwarded).not.toHaveBeenCalledWith(2, expect.anything());
    expect(refresh).toHaveBeenCalled();
  });

  // SPEC-030 T3: a Daggerheart fight shows its Battle Points; nothing else does.
  it("shows a Daggerheart fight's Battle Points, and no other scene's", () => {
    render(
      <SceneList
        {...baseProps}
        rulesSystem="daggerheart"
        partySize={3}
        adventureTier={1}
        scenes={[
          makeScene({ id: 1, kind: SceneKind.Fight, title: "Ambush" }),
          makeScene({ id: 2, kind: SceneKind.Explore, title: "Road" }),
        ]}
      />
    );

    expect(screen.getAllByText(/scene.battlePoints.summary/)).toHaveLength(1);
    expect(screen.getByText(/scene.battlePoints.summary/)).toHaveTextContent(
      '{"spent":0,"budget":11}'
    );
  });

  describe("SPEC-031: difficulty from the counted rows and the page's party", () => {
    const bandit = {
      id: 31,
      sceneId: 1,
      position: 1,
      name: "Road bandit",
      level: null,
      xpEach: 200,
      quantity: 4,
      note: null,
      awarded: false,
      npcId: null,
    };

    beforeEach(() => window.localStorage.clear());

    const renderAdventure = (
      props: Partial<React.ComponentProps<typeof SceneList>>
    ) =>
      render(
        <EncounterAdjustmentsProvider
          adventureId={1}
          defaultPartySize={4}
          creatureIds={[31]}
        >
          <SceneList {...baseProps} scenes={[]} partySize={4} {...props} />
        </EncounterAdjustmentsProvider>
      );

    it("shows a 5e fight's encounter summary, and no other scene's", () => {
      renderAdventure({
        targetLevel: 3,
        scenes: [
          makeScene({ id: 1, kind: SceneKind.Fight, creatures: [bandit] }),
          makeScene({ id: 2, kind: SceneKind.Explore }),
        ],
      });

      expect(screen.getAllByText(/scene.encounter.summary/)).toHaveLength(1);
      expect(screen.getByText(/scene.encounter.summary/)).toHaveTextContent(
        '{"xp":800,"low":600,"moderate":900,"high":1600}'
      );
    });

    it("prices from the counted rows and party size, with a scene Reset", () => {
      window.localStorage.setItem(
        "campaign.encounterAdjustments.1",
        JSON.stringify({ partySize: 2, creatures: { "31": { quantity: 1 } } })
      );
      renderAdventure({
        targetLevel: 3,
        scenes: [makeScene({ id: 1, title: "Toll", creatures: [bandit] })],
      });

      expect(screen.getByText(/scene.encounter.summary/)).toHaveTextContent(
        '{"xp":200,"low":300,"moderate":450,"high":800}'
      );

      fireEvent.click(
        screen.getByRole("button", { name: /scene.encounter.resetLabel/ })
      );

      // The counts are back; the party size is the page's, kept until its own Reset.
      expect(screen.getByText(/scene.encounter.summary/)).toHaveTextContent(
        '{"xp":800,"low":300,"moderate":450,"high":800}'
      );
      expect(
        screen.queryByRole("button", { name: /scene.encounter.resetLabel/ })
      ).not.toBeInTheDocument();
    });

    it("prices a Daggerheart fight exactly as SPEC-030 does with nothing overridden", () => {
      renderAdventure({
        rulesSystem: "daggerheart",
        scenes: [makeScene({ id: 1, kind: SceneKind.Fight })],
      });

      expect(screen.getByText(/scene.battlePoints.summary/)).toHaveTextContent(
        '{"spent":0,"budget":14}'
      );
    });
  });
});
