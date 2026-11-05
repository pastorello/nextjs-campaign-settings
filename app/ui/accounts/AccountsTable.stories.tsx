import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import type Account from "@/app/lib/definitions/interfaces/users/Account";
import AccountsTable from "./AccountsTable";

const accounts: Account[] = [
  {
    id: "dm-1",
    name: "Mara Venti",
    email: "mara@example.test",
    role: "dm",
    active: true,
  },
  {
    id: "player-1",
    name: "Tobia Ferri",
    email: "tobia@example.test",
    role: "player",
    active: true,
  },
  {
    id: "player-2",
    name: "Selene Riva",
    email: "selene@example.test",
    role: "player",
    active: false,
  },
];

/** Every account, with its actions (SPEC-022 T3). An async Server Component. */
const meta = {
  component: AccountsTable,
  args: { accounts, currentUserId: "dm-1" },
} satisfies Meta<typeof AccountsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("(tu)")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Attiva Selene Riva" })
    ).toBeVisible();
  },
};

export const Empty: Story = { args: { accounts: [] } };
