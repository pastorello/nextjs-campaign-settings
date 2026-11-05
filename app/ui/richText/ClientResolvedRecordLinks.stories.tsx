import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";

import resolveRecordLinks from "@/app/lib/data/richText/resolveRecordLinks";
import recordLinkKey from "@/app/lib/utils/richText/recordLinkKey";
import ClientResolvedRecordLinks from "./ClientResolvedRecordLinks";
import RecordLink from "./RecordLink";

/**
 * The client half of record-link resolution (SPEC-019 T5), for formatted text
 * loaded client-side. The `resolveRecordLinks` Server Action is a spy here.
 */
const meta = {
  component: ClientResolvedRecordLinks,
  args: {
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
} satisfies Meta<typeof ClientResolvedRecordLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resolved: Story = {
  beforeEach: () => {
    mocked(resolveRecordLinks).mockResolvedValue({
      targets: { [recordLinkKey("npc", 4)]: "Mirela la Cartografa" },
      deleted: [],
    });
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link")).toBeVisible();
  },
};

/** Nothing links: no request, and the text stays text. */
export const NothingToResolve: Story = {
  args: { values: ["<p>Nessun collegamento.</p>"] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Mirela la Cartografa")).toBeVisible();
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};
