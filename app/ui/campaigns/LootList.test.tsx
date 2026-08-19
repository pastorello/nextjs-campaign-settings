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

const reorderLoot = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/reorderLoot", () => ({
  default: (...args: unknown[]) => reorderLoot(...args),
}));

const deleteLootById = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/deleteLootById", () => ({
  default: (...args: unknown[]) => deleteLootById(...args),
}));

const notifySuccess = vi.fn<(...args: unknown[]) => void>();
const notifyError = vi.fn<(...args: unknown[]) => void>();
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: (...args: unknown[]) => notifySuccess(...args),
  notifyError: (...args: unknown[]) => notifyError(...args),
}));

vi.mock("./LootForm", () => ({
  default: ({ onSaved }: { onSaved: () => void }) => (
    <button onClick={onSaved} data-testid="loot-form">
      save-stub
    </button>
  ),
}));

import LootList from "./LootList";

const coin = {
  id: 1,
  sceneId: 1,
  position: 1,
  description: "A silver coin",
  quantity: 1,
  value: 20,
  taken: false,
  magicItemId: null,
  treasureId: null,
};

const cloak = {
  ...coin,
  id: 2,
  position: 2,
  description: "Cloak of Elvenkind",
  value: null,
  magicItemId: 21,
};

describe("LootList (SPEC-013 T8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays a value converted to the adventure's currency unit", () => {
    render(
      <LootList
        sceneId={1}
        loot={[coin]}
        currencyUnit="gold"
        magicItemOptions={[]}
        treasureOptions={[]}
      />
    );

    expect(
      screen.getByText(/2 adventure.currencyUnits.gold/)
    ).toBeInTheDocument();
  });

  it("reorders by swapping with the next loot row and refreshes", async () => {
    reorderLoot.mockResolvedValue({ ok: true });
    render(
      <LootList
        sceneId={1}
        loot={[coin, cloak]}
        currencyUnit="silver"
        magicItemOptions={[]}
        treasureOptions={[]}
      />
    );

    fireEvent.click(screen.getAllByLabelText(/moveDown/)[0]!);

    await waitFor(() => expect(reorderLoot).toHaveBeenCalledWith(1, [2, 1]));
    expect(refresh).toHaveBeenCalled();
  });

  it("deletes a loot row after confirmation and refreshes", async () => {
    deleteLootById.mockResolvedValue(undefined);
    render(
      <LootList
        sceneId={1}
        loot={[coin]}
        currencyUnit="silver"
        magicItemOptions={[]}
        treasureOptions={[]}
      />
    );

    fireEvent.click(screen.getByText("common.form.delete"));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("common.form.delete"));

    await waitFor(() => expect(deleteLootById).toHaveBeenCalledWith(1));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows and hides the add-loot form", () => {
    render(
      <LootList
        sceneId={1}
        loot={[]}
        currencyUnit="silver"
        magicItemOptions={[]}
        treasureOptions={[]}
      />
    );

    expect(screen.queryByTestId("loot-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("loot.list.addButton"));
    expect(screen.getByTestId("loot-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("loot-form"));
    expect(screen.queryByTestId("loot-form")).not.toBeInTheDocument();
  });
});
