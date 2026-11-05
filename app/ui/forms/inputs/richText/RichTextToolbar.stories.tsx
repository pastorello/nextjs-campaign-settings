import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditorContent, useEditor } from "@tiptap/react";
import { expect, fn } from "storybook/test";

import RichTextToolbar from "./RichTextToolbar";
import richTextExtensions from "./richTextExtensions";

/**
 * The formatted-text editor's toolbar (SPEC-019 §5.2): a WAI-ARIA toolbar with
 * one Tab stop, arrow keys between buttons. It is given a live Tiptap editor,
 * as `RichTextInput` does.
 */
function ToolbarWithEditor({ onRequestLink }: { onRequestLink?: () => void }) {
  const editor = useEditor({
    extensions: richTextExtensions(),
    content: "<p>Un velo di ghiaccio ricopre l'arma.</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: { role: "textbox", "aria-label": "Descrizione" },
    },
  });
  if (!editor) return null;
  return (
    <div className="w-[600px] rounded-md border border-gray-300">
      <RichTextToolbar
        editor={editor}
        {...(onRequestLink && { onRequestLink })}
      />
      <EditorContent editor={editor} aria-label="Descrizione" />
    </div>
  );
}

const meta = {
  component: ToolbarWithEditor,
  args: { onRequestLink: fn() },
} satisfies Meta<typeof ToolbarWithEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLinkButton: Story = {
  play: async ({ canvas, userEvent }) => {
    const toolbar = await canvas.findByRole("toolbar");
    await expect(toolbar).toBeVisible();
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect(toolbar.contains(document.activeElement)).toBe(true);
  },
};

export const WithoutLinkButton: Story = {
  render: () => <ToolbarWithEditor />,
};
