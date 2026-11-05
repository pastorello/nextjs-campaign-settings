import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { signOut } from "@/auth";
import SignOutButton from "./SignOutButton";

/** The sidebar's sign-out tile; `@/auth` is a spy in Storybook (ADR-0021). */
const meta = {
  component: SignOutButton,
} satisfies Meta<typeof SignOutButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /esci/i }));
    await waitFor(() =>
      expect(signOut).toHaveBeenCalledWith({ redirectTo: "/" })
    );
  },
};
