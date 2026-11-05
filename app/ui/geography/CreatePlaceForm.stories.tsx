import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import createPlaceFromPicker from "@/app/lib/data/maps/createPlaceFromPicker";
import CreatePlaceForm from "./CreatePlaceForm";

/**
 * "Nuovo luogo", the small form a place picker opens (SPEC-026). The creation
 * is a Server Action, so a spy here (ADR-0021).
 */
const meta = {
  component: CreatePlaceForm,
  args: {
    zones: [
      { id: 1, title: "Aerivel" },
      { id: 2, title: "Marca di Brina" },
    ],
    defaultParentId: 2,
    onCreated: fn(),
    onCancel: fn(),
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof CreatePlaceForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A landmark in the zone the picker was opened from, the form's default. */
export const Create: Story = {
  beforeEach: () => {
    mocked(createPlaceFromPicker).mockResolvedValue({
      ok: true,
      place: { kind: "poi", id: 7, parentId: 2 },
    });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Locanda del Corvo"
    );
    await userEvent.click(canvas.getByRole("button", { name: "Crea" }));

    await waitFor(() =>
      expect(createPlaceFromPicker).toHaveBeenCalledWith({
        title: "Locanda del Corvo",
        parentId: 2,
        kind: "poi",
      })
    );
    await expect(args.onCreated).toHaveBeenCalledWith({
      kind: "poi",
      id: 7,
      parentId: 2,
    });
  },
};

/** The server refused: the form keeps what was typed and says why. */
export const Refused: Story = {
  args: { defaultParentId: null },
  beforeEach: () => {
    mocked(createPlaceFromPicker).mockResolvedValue({
      ok: false,
      errors: { parentId: [{ key: "placeNeedsParent" }] },
    });
  },
  play: async ({ args, canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: /nome/i });
    await userEvent.type(name, "Torre Spezzata");
    await userEvent.click(canvas.getByRole("button", { name: "Crea" }));

    await waitFor(async () =>
      expect(await canvas.findByRole("alert")).toBeVisible()
    );
    await expect(name).toHaveValue("Torre Spezzata");
    await expect(args.onCreated).not.toHaveBeenCalled();
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};
