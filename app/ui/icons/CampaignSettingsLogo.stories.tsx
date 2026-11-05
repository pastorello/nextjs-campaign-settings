import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import CampaignSettingsLogo from "./CampaignSettingsLogo";

/**
 * An async Server Component: its name comes from `getTranslations`, which
 * Storybook serves from the same catalogues (`.storybook/mocks`). White on
 * the sidebar's blue tile, as `sidenav.tsx` places it.
 */
const meta = {
  component: CampaignSettingsLogo,
  decorators: [
    (Story) => (
      <div className="inline-flex rounded-md bg-blue-600 p-4">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof CampaignSettingsLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Campaign Settings")).toBeVisible();
  },
};

export const Small: Story = { args: { size: "sm" } };

export const Large: Story = { args: { size: "lg" } };
