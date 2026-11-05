import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";

import { searchResult } from "@/.storybook/fixtures/search";
import searchRecordLinks from "@/app/lib/data/search/searchRecordLinks";
import RichTextInput from "./RichTextInput";

/**
 * The formatted-text editor (SPEC-019, ADR-0016): Tiptap with the app's
 * toolbar, storing sanitised HTML. The link button opens `RecordLinkPicker`,
 * which searches through a Server Action — a spy here (ADR-0021).
 */
const meta = {
  component: RichTextInput,
  args: {
    label: "Descrizione",
    value: "<p>Un velo di <strong>ghiaccio</strong> ricopre l'arma.</p>",
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RichTextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithContent: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("toolbar", { name: /formattazione/i })
    ).toBeVisible();
    await expect(canvas.getByText("ghiaccio").tagName).toBe("STRONG");
  },
};

export const Empty: Story = {
  args: { value: "", placeholder: "Inserisci testo..." },
};

export const Tall: Story = { args: { tall: true } };

/** Typing reports the new HTML to the form. */
export const Typing: Story = {
  args: { value: "" },
  play: async ({ args, canvas, userEvent }) => {
    const editor = await canvas.findByRole("textbox");
    await userEvent.click(editor);
    await userEvent.keyboard("Brina");
    await waitFor(() =>
      expect(args.onChange).toHaveBeenLastCalledWith("<p>Brina</p>")
    );
  },
};

export const LinkToARecord: Story = {
  beforeEach: () => {
    mocked(searchRecordLinks).mockResolvedValue(
      searchResult({
        npc: [{ id: 4, name: "Mirela la Cartografa" }],
        places: [{ id: 9, name: "Kang" }],
      })
    );
  },
  play: async ({ canvas, userEvent }) => {
    // The link button acts on a selection: pick the word first.
    await userEvent.dblClick(await canvas.findByText("ghiaccio"));
    await userEvent.click(
      canvas.getByRole("button", { name: "Collega a una scheda" })
    );
    // The picker is `lazy()`: on a cold dev server its chunk can take longer
    // to compile than `findBy`'s one-second default.
    const dialog = await screen.findByRole("dialog", {}, { timeout: 10_000 });
    await userEvent.type(await screen.findByRole("searchbox"), "mir");
    await expect(
      await screen.findByRole("button", { name: /mirela/i })
    ).toBeVisible();
    await expect(dialog).toBeVisible();
    await waitFor(() =>
      expect(searchRecordLinks).toHaveBeenCalledWith("mir", "dnd5e")
    );
  },
};
