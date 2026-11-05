import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { human, universal } from "@/.storybook/fixtures/calendar";
import createDateSystem from "@/app/lib/data/calendar/createDateSystem";
import updateDateSystem from "@/app/lib/data/calendar/updateDateSystem";
import updateUniversalDateSystem from "@/app/lib/data/calendar/updateUniversalDateSystem";
import DateSystemForm from "./DateSystemForm";

/** Creates or edits a date system (SPEC-014 §5.2). */
const meta = {
  component: DateSystemForm,
  args: { onCancel: fn(), onSaved: fn() },
} satisfies Meta<typeof DateSystemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDateSystem).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Calendario nano"
    );
    await userEvent.click(canvas.getByRole("button", { name: "Crea" }));
    await waitFor(() =>
      expect(createDateSystem).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Calendario nano" })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const EditCustom: Story = {
  args: { system: human },
  beforeEach: () => {
    mocked(updateDateSystem).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox", { name: "Nome" })).toHaveValue(
      human.name
    );
    await userEvent.click(canvas.getByRole("button", { name: "Salva" }));
    await waitFor(() =>
      expect(updateDateSystem).toHaveBeenCalledWith(
        expect.objectContaining({ id: human.id })
      )
    );
  },
};

export const EditUniversal: Story = {
  args: { system: universal },
  beforeEach: () => {
    mocked(updateUniversalDateSystem).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    // The universal count has no anchor event and no "before" labels.
    await expect(
      canvas.queryByRole("textbox", { name: "Evento di riferimento" })
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(updateUniversalDateSystem).toHaveBeenCalled());
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};
