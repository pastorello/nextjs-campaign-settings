import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";

import getViewer from "@/app/lib/auth/getViewer";
import fetchRecordLinkTargets from "@/app/lib/data/richText/fetchRecordLinkTargets";
import recordLinkKey from "@/app/lib/utils/richText/recordLinkKey";
import { dm } from "@/.storybook/fixtures/viewers";
import RecordLink from "./RecordLink";
import ResolvedRecordLinks from "./ResolvedRecordLinks";

/**
 * The server half of record-link resolution (SPEC-019 T5): one batched read
 * for every link in the page's formatted text. An async Server Component.
 */
const meta = {
  component: ResolvedRecordLinks,
  args: {
    system: "dnd5e",
    values: [
      '<p><a data-record-domain="npc" data-record-id="4">Mirela</a></p>',
    ],
    children: (
      <p>
        <RecordLink domain="npc" id={4}>
          Mirela la Cartografa
        </RecordLink>
      </p>
    ),
  },
  beforeEach: () => {
    // `getVisibilityScope` asks who is reading.
    mocked(getViewer).mockResolvedValue(dm);
  },
} satisfies Meta<typeof ResolvedRecordLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resolved: Story = {
  beforeEach: () => {
    mocked(fetchRecordLinkTargets).mockResolvedValue({
      [recordLinkKey("npc", 4)]: "Mirela la Cartografa",
    });
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link")).toBeVisible();
  },
};

export const RecordDeleted: Story = {
  beforeEach: () => {
    mocked(fetchRecordLinkTargets).mockResolvedValue({});
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Mirela la Cartografa")).toBeVisible();
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};
