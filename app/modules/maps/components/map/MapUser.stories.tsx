import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, screen, waitFor } from "storybook/test";

import { MapUser } from "./MapUser";

/** Vendored (CLAUDE.md, "unused is not dead"): the account menu of the starter. */
const meta = { component: MapUser } satisfies Meta<typeof MapUser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button")).toBeVisible();
  },
};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button"));
    await waitFor(async () =>
      expect(
        await screen.findByRole("menuitem", { name: "Settings" })
      ).toBeVisible()
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Close Maps" }));
    await expect(getRouter().push).toHaveBeenCalledWith("/");
  },
};
