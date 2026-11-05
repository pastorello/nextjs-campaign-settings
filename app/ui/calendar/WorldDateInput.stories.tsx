import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import { day, human, systems } from "@/.storybook/fixtures/calendar";
import WorldDateInput from "./WorldDateInput";

/** Entering a date in any date system (SPEC-014 §5.8). */
const meta = {
  component: WorldDateInput,
  args: {
    legend: "Inizio",
    systems,
    value: { universalDay: day(3), hour: null },
    initialSystemId: human.id,
    onChange: fn(),
  },
} satisfies Meta<typeof WorldDateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: "Inizio" })).toBeVisible();
    await expect(canvas.getByLabelText("Giorno")).toHaveValue(3);
  },
};

export const Empty: Story = {
  args: { value: { universalDay: null, hour: null } },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Giorno")).toHaveValue(null);
  },
};

export const EditDay: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByLabelText("Giorno");
    await userEvent.clear(input);
    await userEvent.type(input, "7");
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith({
        universalDay: day(7),
        hour: null,
      })
    );
  },
};

export const WithError: Story = {
  args: { error: "La fine precede l'inizio." },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("La fine precede l'inizio.")).toBeVisible();
  },
};
