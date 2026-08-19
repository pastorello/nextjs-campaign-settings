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
    expect(link).toHaveAttribute("href", "/dashboard/geography?place=5");
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
});
