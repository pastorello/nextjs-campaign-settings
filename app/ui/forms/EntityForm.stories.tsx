import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import { frostBlade } from "@/.storybook/fixtures/spells";
import type Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import PageType from "@/app/lib/definitions/types/PageType";
import EntityForm from "./EntityForm";

/**
 * The shell every domain form shares (TD-09): state, submit, validation
 * errors, title and buttons. The domain supplies the mutations, the copy and
 * the field layout; here it is a spell with two fields.
 */
const meta = {
  component: EntityForm<Spell>,
  args: {
    pageType: PageType.Spell,
    mutations: {
      create: fn(() => Promise.resolve({ ok: true as const })),
      update: fn(() => Promise.resolve({ ok: true as const })),
    },
    copy: {
      createTitle: "Nuovo incantesimo",
      editTitle: "Modifica incantesimo",
      createButton: "Crea",
      editButton: "Salva",
    },
    onCancel: fn(),
    onSaveFinished: fn(),
    children: (field) => (
      <div className="grid grid-cols-2 gap-4">
        {field("name")}
        {field("level")}
      </div>
    ),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EntityForm<Spell>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Lama d'ombra"
    );
    await userEvent.click(canvas.getByRole("button", { name: "Crea" }));
    await waitFor(() => expect(args.mutations.create).toHaveBeenCalled());
    await waitFor(() => expect(args.onSaveFinished).toHaveBeenCalled());
  },
};

/** An update carries the id and only what changed. */
export const Edit: Story = {
  args: { formData: frostBlade },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "Salva" })).toBeDisabled();
    await userEvent.type(canvas.getByRole("textbox", { name: /nome/i }), "!");
    await userEvent.click(canvas.getByRole("button", { name: "Salva" }));
    await waitFor(() =>
      expect(args.mutations.update).toHaveBeenCalledWith({
        id: frostBlade.id,
        name: "Lama di brina!",
      })
    );
  },
};

export const Refused: Story = {
  args: {
    mutations: {
      create: fn(() =>
        Promise.resolve({
          ok: false as const,
          errors: {
            name: [{ key: "tooShort" as const, values: { minimum: 3 } }],
          },
        })
      ),
      update: fn(() => Promise.resolve({ ok: true as const })),
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: /nome/i }), "a");
    await userEvent.click(canvas.getByRole("button", { name: "Crea" }));
    await waitFor(() => expect(args.mutations.create).toHaveBeenCalled());
    await expect(await canvas.findByRole("alert")).toBeVisible();
    await expect(args.onSaveFinished).not.toHaveBeenCalled();
  },
};
