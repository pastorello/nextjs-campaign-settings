import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { portrait } from "@/.storybook/fixtures/images";
import RecordDisplayImage from "./RecordDisplayImage";
import RecordThumbnail from "./RecordThumbnail";

/**
 * A record's image (SPEC-020): the list thumbnail and the card's display
 * version. Without an image the thumbnail keeps its place with a placeholder,
 * and the display image renders nothing.
 */
const meta = {
  component: RecordThumbnail,
  subcomponents: { RecordDisplayImage },
  args: { image: portrait, name: "Mirela la Cartografa" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
} satisfies Meta<typeof RecordThumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Thumbnail: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Mirela la Cartografa" })
    ).toBeVisible();
  },
};

export const ThumbnailSizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-4">
      <RecordThumbnail {...args} size="sm" />
      <RecordThumbnail {...args} size="md" />
    </div>
  ),
};

export const ThumbnailPlaceholder: Story = {
  args: { image: null },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByTestId("record-thumbnail-placeholder")
    ).toBeInTheDocument();
  },
};

export const DisplayImage: Story = {
  render: (args) => <RecordDisplayImage image={args.image} name={args.name} />,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Mirela la Cartografa" })
    ).toHaveAttribute("width", "600");
  },
};
