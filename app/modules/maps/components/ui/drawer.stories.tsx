import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, waitFor } from "storybook/test";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

/**
 * Vendored (CLAUDE.md, "unused is not dead"): the starter's shadcn drawer,
 * over vaul. Its content renders in a portal, so the stories look in
 * `screen`.
 */
const meta = {
  component: Drawer,
  args: { children: null },
  render: () => (
    <Drawer>
      <DrawerTrigger>Apri il cassetto</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Luoghi</DrawerTitle>
          <DrawerDescription>Quelli di questa mappa.</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Apri il cassetto" })
    ).toBeVisible();
  },
};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Apri il cassetto" })
    );
    await waitFor(async () =>
      expect(
        await screen.findByRole("dialog", { name: "Luoghi" })
      ).toBeVisible()
    );
  },
};
