import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import {
  historyEvents,
  human,
  linkOptions,
  systems,
} from "@/.storybook/fixtures/calendar";
import createWorldHistoryEvent from "@/app/lib/data/calendar/createWorldHistoryEvent";
import updateWorldHistoryEvent from "@/app/lib/data/calendar/updateWorldHistoryEvent";
import WorldHistoryEventForm from "./WorldHistoryEventForm";

/** Adds or edits a world history event (SPEC-014 §5.4). */
const meta = {
  component: WorldHistoryEventForm,
  args: {
    systems,
    displaySystemId: human.id,
    linkOptions,
    onCancel: fn(),
    onSaved: fn(),
  },
} satisfies Meta<typeof WorldHistoryEventForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createWorldHistoryEvent).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: /titolo/i }),
      "Il Concilio"
    );
    await userEvent.type(canvas.getByLabelText("Giorno"), "8");
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi evento" })
    );

    await waitFor(() =>
      expect(createWorldHistoryEvent).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Il Concilio" })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const Edit: Story = {
  args: { event: historyEvents[0]! },
  beforeEach: () => {
    mocked(updateWorldHistoryEvent).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox", { name: /titolo/i })).toHaveValue(
      "La Caduta del Faro"
    );
    await userEvent.click(canvas.getByRole("button", { name: "Salva evento" }));
    await waitFor(() =>
      expect(updateWorldHistoryEvent).toHaveBeenCalledWith(
        historyEvents[0]!.id,
        expect.objectContaining({ title: "La Caduta del Faro" })
      )
    );
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};
