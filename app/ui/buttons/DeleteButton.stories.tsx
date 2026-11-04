import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, screen, spyOn, waitFor, within } from "storybook/test";

import PageType from "@/app/lib/definitions/types/PageType";
import DeleteButton from "./DeleteButton";

/**
 * A row's delete action: a confirmation dialog, then the domain's `DELETE`
 * route. `fetch` is stubbed per story with the route's three answers.
 */
const meta = {
  component: DeleteButton,
  args: { pageName: "Lama di brina", pageId: 1, pageType: PageType.Spell },
} satisfies Meta<typeof DeleteButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const answer = (body: object) =>
  spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
    })
  );

type PlayContext = Parameters<NonNullable<Story["play"]>>[0];

/** Opens the confirmation and confirms it. */
async function confirmDelete({ canvas, userEvent }: PlayContext) {
  await userEvent.click(canvas.getByRole("button", { name: /lama di brina/i }));
  const dialog = await screen.findByRole("dialog");
  await userEvent.click(
    within(dialog).getByRole("button", { name: /elimina/i })
  );
}

export const Deleted: Story = {
  beforeEach: () => {
    answer({ success: true });
  },
  play: async (context) => {
    await confirmDelete(context);
    await waitFor(() => expect(getRouter().refresh).toHaveBeenCalled());
    await expect(globalThis.fetch).toHaveBeenCalledWith("/api/spells/1", {
      method: "DELETE",
    });
  },
};

/** The server refused, with a reason the UI translates (e.g. still in use). */
export const Refused: Story = {
  beforeEach: () => {
    answer({ success: false, refusal: { key: "invalid" } });
  },
  play: async (context) => {
    await confirmDelete(context);
    await expect(
      await screen.findByText("Valore non valido.")
    ).toBeInTheDocument();
    await expect(getRouter().refresh).not.toHaveBeenCalled();
  },
};

export const NetworkFailure: Story = {
  beforeEach: () => {
    spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
  },
  play: async (context) => {
    await confirmDelete(context);
    await expect(getRouter().refresh).not.toHaveBeenCalled();
  },
};
