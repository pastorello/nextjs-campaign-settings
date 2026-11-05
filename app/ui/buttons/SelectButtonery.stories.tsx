import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, waitFor } from "storybook/test";

import ButtonSize from "./BaseButton/ButtonSize";
import SelectButtonery from "./SelectButtonery";
import { dashboardPath } from "@/i18n/dashboardPath";

/**
 * A field's options as a column of filter chips, from its `PageMeta` options.
 * Each chip is a toggle (`aria-pressed`, TD-134); "All" clears the filter.
 */
const meta = {
  component: SelectButtonery,
  args: { fieldKey: "level" },
  parameters: {
    nextjs: {
      navigation: { pathname: dashboardPath("dnd5e", "/spells"), query: {} },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectButtonery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NothingSelected: Story = {
  play: async ({ canvas, userEvent }) => {
    const chips = canvas.getAllByRole("button");
    // "All" is pressed while no option is.
    await expect(chips[0]).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(chips[2]!);
    await waitFor(() => expect(getRouter().replace).toHaveBeenCalled());
  },
};

export const OneSelected: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        query: { level: "2" },
      },
    },
  },
};

export const WithCounts: Story = {
  args: {
    itemStats: {
      total: 12,
      filtered: { 0: 3, 1: 4, 2: 5 },
      partial: { 0: 3, 1: 4, 2: 5 },
    },
  },
};

export const Squared: Story = {
  args: { buttonSize: ButtonSize.squaredSmall, buttonClassName: "m-1" },
  decorators: [
    (Story) => (
      <div className="flex w-[600px] flex-wrap">
        <Story />
      </div>
    ),
  ],
};

export const SomeOptions: Story = {
  args: { filterOptions: [1, 2, 3], omitAllButton: true },
};
