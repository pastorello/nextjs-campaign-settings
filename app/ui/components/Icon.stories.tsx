import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ButtonSize from "../buttons/BaseButton/ButtonSize";
import IconType from "../buttons/BaseButton/IconType";
import Icon from "./Icon";

/** The inline SVG set `BaseButton` draws its `icon` from. */
const meta = {
  component: Icon,
  args: { iconType: IconType.search },
  argTypes: {
    iconType: { control: "select", options: Object.values(IconType) },
    size: { control: "select", options: Object.values(ButtonSize) },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {};

export const AllIcons: Story = {
  render: (args) => (
    <ul className="flex gap-6">
      {Object.values(IconType).map((iconType) => (
        <li key={iconType} className="flex flex-col items-center gap-2">
          <Icon {...args} iconType={iconType} />
          <code className="text-xs">{iconType}</code>
        </li>
      ))}
    </ul>
  ),
};
