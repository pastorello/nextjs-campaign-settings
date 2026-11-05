import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ResetButton } from "./ResetSearchButton";

/** Clears every search parameter of the list page (the "Reset" button). */
const meta = { component: ResetButton } satisfies Meta<typeof ResetButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
