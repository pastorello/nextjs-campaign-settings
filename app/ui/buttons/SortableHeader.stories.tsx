import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, waitFor } from "storybook/test";

import SortableHeader from "./SortableHeader";
import { dashboardPath } from "@/i18n/dashboardPath";

/**
 * A list column's header: a filter built from the field's `PageMeta` options,
 * and a sort control. Both write the URL's query params.
 */
const meta = {
  component: SortableHeader,
  args: { label: "Livello", fieldKey: "level" },
  parameters: {
    nextjs: {
      navigation: { pathname: dashboardPath("dnd5e", "/spells"), query: {} },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SortableHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FilterAndSort: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /ordina/i }));
    await waitFor(() =>
      expect(getRouter().replace).toHaveBeenCalledWith(
        expect.stringContaining("sort=desc")
      )
    );
  },
};

export const Filtered: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        query: { level: "2" },
      },
    },
  },
};

export const SortOnly: Story = { args: { isFiltrable: false } };

export const LabelOnly: Story = {
  args: { isFiltrable: false, isSortable: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Livello")).toBeVisible();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};
