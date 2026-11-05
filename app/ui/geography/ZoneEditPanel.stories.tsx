import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";

import updateZoneDetails from "@/app/lib/data/maps/updateZoneDetails";
import ZoneEditPanel from "./ZoneEditPanel";

/**
 * "Modifica luogo": name, description and picture, plus the two ways into
 * editing the place's area (TD-104). The save is a Server Action, so a spy
 * here (ADR-0021).
 */
const meta = {
  component: ZoneEditPanel,
  args: {
    placeId: 3,
    isOpen: true,
    onClose: fn(),
    title: "Marca di Brina",
    description: null,
    imageId: null,
    hasFootprint: true,
    onSaved: fn(),
    onRedrawArea: fn(),
    onEditOutline: fn(),
  },
  beforeEach: () => {
    mocked(updateZoneDetails).mockResolvedValue({ ok: true });
  },
} satisfies Meta<typeof ZoneEditPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Edit: Story = {
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog", { name: "Modifica luogo" });
    const name = screen.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue("Marca di Brina");

    await userEvent.clear(name);
    await userEvent.type(name, "Marca Grigia");
    await userEvent.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() =>
      expect(updateZoneDetails).toHaveBeenCalledWith({
        id: 3,
        title: "Marca Grigia",
        description: null,
      })
    );
    await expect(args.onSaved).toHaveBeenCalledWith("Marca Grigia", null);
    await expect(args.onClose).toHaveBeenCalled();
  },
};

/** A refusal keeps the dialog open, with the reason in the summary. */
export const Refused: Story = {
  beforeEach: () => {
    mocked(updateZoneDetails).mockResolvedValue({
      ok: false,
      errors: { title: [{ key: "tooShort", values: { minimum: 1 } }] },
    });
  },
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.clear(screen.getByRole("textbox", { name: "Nome" }));
    await userEvent.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(async () =>
      expect(await screen.findByRole("alert")).toBeVisible()
    );
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

/** Saves first, then hands over to drawing the new outline on the map. */
export const RedrawArea: Story = {
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.click(
      screen.getByRole("button", { name: "Ridisegna il contorno" })
    );
    await waitFor(() =>
      expect(args.onRedrawArea).toHaveBeenCalledWith("Marca di Brina")
    );
    await expect(updateZoneDetails).toHaveBeenCalled();
  },
};

export const EditOutline: Story = {
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.click(
      screen.getByRole("button", { name: "Modifica il contorno" })
    );
    await waitFor(() =>
      expect(args.onEditOutline).toHaveBeenCalledWith("Marca di Brina")
    );
  },
};

/** A place that is a point has no outline to edit, and says so. */
export const WithoutArea: Story = {
  args: { hasFootprint: false },
  play: async () => {
    await screen.findByRole("dialog");
    await expect(
      screen.getByRole("button", { name: "Modifica il contorno" })
    ).toBeDisabled();
    await expect(screen.getByText(/è un punto, non un’area/)).toBeVisible();
  },
};
