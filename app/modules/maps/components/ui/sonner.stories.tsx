import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { toast } from "sonner";
import { expect, screen, waitFor } from "storybook/test";

import { Toaster } from "./sonner";

/**
 * Vendored (CLAUDE.md, "unused is not dead"): the starter's themed Sonner
 * host. The app's own host is `app/ui/components/Toaster`. As there, the
 * toast region is outside the axe check (`preview.tsx`) while it slides in.
 */
const meta = {
  component: Toaster,
  // Two hosts are mounted here (this one and the preview's), so Sonner's two
  // "Notifications" landmarks share a name — a fact of the story, not of the
  // app, which mounts one. Both regions are left to `Toaster.stories.tsx`.
  parameters: {
    a11y: {
      context: {
        include: ["body"],
        exclude: [
          "[data-sonner-toaster]",
          "section[aria-label^='Notifications']",
        ],
      },
    },
  },
  render: () => (
    <>
      <button type="button" onClick={() => toast("Luogo salvato.")}>
        Avvisa
      </button>
      <Toaster />
    </>
  ),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Avvisa" }));
    // The preview's own host shows it too: one toast per host.
    const [title] = await screen.findAllByText("Luogo salvato.");
    const toast = title?.closest("[data-sonner-toast]");
    await waitFor(() => expect(toast).toHaveAttribute("data-mounted", "true"));
    await waitFor(() => expect(getComputedStyle(toast!).opacity).toBe("1"));
    await expect(title).toBeVisible();
  },
};
