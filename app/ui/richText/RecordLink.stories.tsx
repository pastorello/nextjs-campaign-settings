import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import recordLinkKey from "@/app/lib/utils/richText/recordLinkKey";
import RecordLink from "./RecordLink";
import RecordLinkTargetsProvider from "./RecordLinkTargetsProvider";

/**
 * A record link inside a formatted description (SPEC-019 §5.4): a link when
 * the nearest provider resolved it, its text otherwise.
 */
const meta = {
  component: RecordLink,
  args: { domain: "npc", id: 4, children: "Mirela la Cartografa" },
} satisfies Meta<typeof RecordLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resolved: Story = {
  decorators: [
    (Story) => (
      <RecordLinkTargetsProvider
        targets={{ [recordLinkKey("npc", 4)]: "Mirela la Cartografa" }}
      >
        <p>
          Cerca <Story />.
        </p>
      </RecordLinkTargetsProvider>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "Mirela la Cartografa" })
    ).toBeVisible();
  },
};

export const WithoutProvider: Story = {
  decorators: [
    (Story) => (
      <p>
        Cerca <Story />.
      </p>
    ),
  ],
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};
