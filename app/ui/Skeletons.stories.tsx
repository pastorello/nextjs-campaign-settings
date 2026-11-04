import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import PageType from "@/app/lib/definitions/types/PageType";
import DashboardSkeleton, {
  CardSkeleton,
  CardsSkeleton,
  LibrarySkeleton,
  TableSkeleton,
} from "./skeletons";

/** What a page shows while its Server Component streams in (`loading.tsx`). */
const meta = {
  component: DashboardSkeleton,
  subcomponents: {
    CardSkeleton,
    CardsSkeleton,
    LibrarySkeleton,
    TableSkeleton,
  },
} satisfies Meta<typeof DashboardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {};

export const Card: Story = { render: () => <CardSkeleton /> };

export const Cards: Story = { render: () => <CardsSkeleton /> };

export const Library: Story = { render: () => <LibrarySkeleton /> };

/** The column count follows the page's list configuration. */
export const SpellTable: Story = {
  render: () => <TableSkeleton pageType={PageType.Spell} />,
};

export const DefaultTable: Story = { render: () => <TableSkeleton /> };
