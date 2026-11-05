import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, waitFor } from "storybook/test";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

/**
 * Vendored (CLAUDE.md, "unused is not dead"): the starter's shadcn dropdown
 * menu, over Radix. Its content renders in a portal, so the stories look in
 * `screen`.
 */
const meta = {
  component: DropdownMenu,
  args: { children: null },
  render: () => {
    const onSelect = fn();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>Apri</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Mappa</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onSelect}>Esporta</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Svuota</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Apri" })).toBeVisible();
  },
};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Apri" }));
    await waitFor(async () =>
      expect(
        await screen.findByRole("menuitem", { name: "Esporta" })
      ).toBeVisible()
    );
    await expect(
      screen.getByRole("menuitem", { name: "Svuota" })
    ).toBeVisible();
    // Radix hides the page from assistive technology while the menu is open,
    // and its trigger stays focusable under that; axe runs on the closed menu.
    await userEvent.keyboard("{Escape}");
  },
};
