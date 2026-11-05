import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen } from "storybook/test";

import { searchResult } from "@/.storybook/fixtures/search";
import searchRecordLinks from "@/app/lib/data/search/searchRecordLinks";
import RecordLinkPicker from "./RecordLinkPicker";

/**
 * The record-link picker (SPEC-019 §5.3): a dialog with a search box running
 * the cross-entity search through a Server Action — a spy here.
 */
const meta = {
  component: RecordLinkPicker,
  args: { isOpen: true, setIsOpen: fn(), onChoose: fn() },
} satisfies Meta<typeof RecordLinkPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Prompt: Story = {
  play: async () => {
    await expect(await screen.findByRole("dialog")).toBeVisible();
  },
};

export const ChoosingAResult: Story = {
  beforeEach: () => {
    mocked(searchRecordLinks).mockResolvedValue(
      searchResult({
        npc: [{ id: 4, name: "Mirela la Cartografa" }],
        places: [{ id: 9, name: "Kang" }],
      })
    );
  },
  play: async ({ args, userEvent }) => {
    await userEvent.type(
      await screen.findByLabelText("Cerca schede per nome"),
      "mir"
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Mirela la Cartografa" })
    );
    await expect(args.onChoose).toHaveBeenCalledWith({ domain: "npc", id: 4 });
  },
};

export const NoMatches: Story = {
  beforeEach: () => {
    mocked(searchRecordLinks).mockResolvedValue(searchResult());
  },
  play: async ({ userEvent }) => {
    await userEvent.type(
      await screen.findByLabelText("Cerca schede per nome"),
      "xyz"
    );
    await expect(await screen.findByText(/xyz/)).toBeVisible();
  },
};

export const SearchFailed: Story = {
  beforeEach: () => {
    mocked(searchRecordLinks).mockRejectedValue(new Error("offline"));
  },
  play: async ({ userEvent }) => {
    await userEvent.type(
      await screen.findByLabelText("Cerca schede per nome"),
      "mir"
    );
    await expect(await screen.findByText(/non riuscita|errore/i)).toBeVisible();
  },
};
