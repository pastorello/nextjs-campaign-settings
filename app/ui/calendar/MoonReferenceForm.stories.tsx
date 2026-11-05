import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { day, human, systems } from "@/.storybook/fixtures/calendar";
import setMoonReferenceDay from "@/app/lib/data/calendar/setMoonReferenceDay";
import MoonReferenceForm from "./MoonReferenceForm";

/** The moon's reference new moon (SPEC-014 §5.3). */
const meta = {
  component: MoonReferenceForm,
  args: { systems, displaySystemId: human.id, moonNewMoonDay: day(1) },
  beforeEach: () => {
    mocked(setMoonReferenceDay).mockResolvedValue({ ok: true });
  },
} satisfies Meta<typeof MoonReferenceForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithReference: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Rimuovi" })).toBeVisible();
  },
};

export const NotSet: Story = {
  args: { moonNewMoonDay: null },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole("button", { name: "Rimuovi" })
    ).not.toBeInTheDocument();
  },
};

export const Clear: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Rimuovi" }));
    await waitFor(() =>
      expect(setMoonReferenceDay).toHaveBeenCalledWith({ moonNewMoonDay: null })
    );
  },
};
