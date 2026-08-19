import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
}));

const reorderSceneCreatures = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/reorderSceneCreatures", () => ({
  default: (...args: unknown[]) => reorderSceneCreatures(...args),
}));

const deleteSceneCreatureById = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/deleteSceneCreatureById", () => ({
  default: (...args: unknown[]) => deleteSceneCreatureById(...args),
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
});
