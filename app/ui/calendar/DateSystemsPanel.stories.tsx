import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";

import { human, systems } from "@/.storybook/fixtures/calendar";
import deleteDateSystemById from "@/app/lib/data/calendar/deleteDateSystemById";
import setDefaultDateSystem from "@/app/lib/data/calendar/setDefaultDateSystem";
import DateSystemsPanel from "./DateSystemsPanel";

/** `/world/calendar`'s date systems: the universal count, then the DM's own. */
const meta = {
  component: DateSystemsPanel,
  args: { systems: [...systems] },
} satisfies Meta<typeof DateSystemsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Calendario umano")).toBeVisible();
    await expect(canvas.getByText("Predefinito")).toBeVisible();
    // The universal count and the default offer no delete.
    await expect(
      canvas.getAllByRole("button", { name: /Elimina/ })
    ).toHaveLength(1);
  },
};

export const OnlyUniversal: Story = {
  args: { systems: [systems[0]!] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Nessun altro sistema/)).toBeVisible();
  },
};

export const AddOpensForm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi un sistema di datazione" })
    );
    await expect(canvas.getByRole("button", { name: "Crea" })).toBeVisible();
  },
};

export const MakeDefault: Story = {
  beforeEach: () => {
    mocked(setDefaultDateSystem).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /Rendi predefinito/ })
    );
    await waitFor(() =>
      expect(setDefaultDateSystem).toHaveBeenCalledWith(human.id)
    );
  },
};

export const Delete: Story = {
  args: {
    systems: [
      systems[0]!,
      { ...human, isDefault: false },
      { ...human, id: 3, name: "Calendario nano", isDefault: false },
    ],
  },
  beforeEach: () => {
    mocked(deleteDateSystemById).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Elimina/ })[0]!
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() => expect(deleteDateSystemById).toHaveBeenCalled());
  },
};
