import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { encounterAdjustmentsKey } from "@/app/lib/hooks/useEncounterAdjustments";
import EncounterAdjustmentsProvider from "./EncounterAdjustmentsProvider";
import PartySizeControl from "./PartySizeControl";

/**
 * The adventure page's number of characters (SPEC-031 §5.C.8). It reads the
 * provider's state, so the story supplies one, as the page does.
 */
const meta = {
  component: PartySizeControl,
  decorators: [
    (Story) => (
      <EncounterAdjustmentsProvider
        adventureId={5}
        defaultPartySize={4}
        creatureIds={[]}
      >
        <Story />
      </EncounterAdjustmentsProvider>
    ),
  ],
  beforeEach: () => {
    window.localStorage.removeItem(encounterAdjustmentsKey(5));
  },
} satisfies Meta<typeof PartySizeControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("button", { name: "Numero di personaggi" })
    ).toBeVisible();
    await expect(canvas.getByText(/Dal gruppo: 4/)).toBeVisible();
    // Nothing to reset until the party size is changed.
    await expect(
      canvas.queryByRole("button", { name: "Ripristina" })
    ).not.toBeInTheDocument();
  },
};
