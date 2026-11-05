import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { human, systems } from "@/.storybook/fixtures/calendar";
import { draftFromEvent } from "./calendarEventDraft";
import CalendarEventFields from "./CalendarEventFields";

/** The fields every event form has (SPEC-014 §5.4). */
const meta = {
  component: CalendarEventFields,
  args: {
    draft: draftFromEvent(undefined),
    onChange: fn(),
    systems,
    displaySystemId: human.id,
    fieldErrors: {},
  },
} satisfies Meta<typeof CalendarEventFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: /titolo/i }), "A");
    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: "A" })
    );
  },
};

export const WithEnd: Story = {
  args: { draft: { ...draftFromEvent(undefined), hasEnd: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Fine" })).toBeVisible();
  },
};

export const WithErrors: Story = {
  args: { fieldErrors: { startDay: ["La data non esiste."] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("La data non esiste.")).toBeVisible();
  },
};
