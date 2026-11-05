import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import useEncounterAdjustments, {
  encounterAdjustmentsKey,
} from "@/app/lib/hooks/useEncounterAdjustments";
import EncounterAdjustmentsProvider from "./EncounterAdjustmentsProvider";

/** Reads the shared state back, as the party-size control and scene list do. */
function PartySizeReadout() {
  const adjustments = useEncounterAdjustments();
  return <p>{`Party: ${adjustments?.partySize ?? "none"}`}</p>;
}

/**
 * The adventure page's one shared on-the-fly state (SPEC-031 §5.C): browser
 * only, one `localStorage` key per adventure.
 */
const meta = {
  component: EncounterAdjustmentsProvider,
  args: {
    adventureId: 5,
    defaultPartySize: 4,
    creatureIds: [1, 2],
    children: <PartySizeReadout />,
  },
  beforeEach: () => {
    window.localStorage.removeItem(encounterAdjustmentsKey(5));
  },
} satisfies Meta<typeof EncounterAdjustmentsProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StartsAtCampaignPartySize: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Party: 4")).toBeVisible();
  },
};

export const LargerParty: Story = {
  args: { defaultPartySize: 6 },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Party: 6")).toBeVisible();
  },
};
