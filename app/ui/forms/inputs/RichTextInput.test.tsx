import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Editor } from "@tiptap/core";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ system: "dnd5e" }),
}));

const { searchRecordLinks } = vi.hoisted(() => ({
  searchRecordLinks: vi.fn(),
}));
vi.mock("@/app/lib/data/search/searchRecordLinks", () => ({
  default: searchRecordLinks,
}));

import DeletedRecordLinksContext from "@/app/ui/richText/DeletedRecordLinksContext";
import RichTextInput from "./RichTextInput";

/** Tiptap hangs its instance on the editable element (`view.dom.editor`). */
async function renderEditor(value = "", onChange = vi.fn()) {
  const result = render(
    <RichTextInput value={value} onChange={onChange} label="Description" />
  );
  const textbox = await screen.findByRole("textbox");
  const editor = (textbox as unknown as { editor: Editor }).editor;
  return { ...result, textbox, editor, onChange };
}

const button = (key: string) => screen.getByRole("button", { name: key });

describe("RichTextInput", () => {
  it("is a labelled multi-line textbox", async () => {
    const { textbox } = await renderEditor();

    expect(textbox).toHaveAttribute("aria-multiline", "true");
    expect(screen.getByRole("textbox", { name: "Description" })).toBe(textbox);
  });

  it("loads legacy plain text as one paragraph per line, without emitting", async () => {
    const { editor, onChange } = await renderEditor("First\nSecond");

    expect(editor.getHTML()).toBe("<p>First</p><p>Second</p>");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("loads formatted text sanitised", async () => {
    const { editor } = await renderEditor(
      '<p>Safe <strong>bold</strong><img src="x" onerror="alert(1)"></p>'
    );

    expect(editor.getHTML()).toBe("<p>Safe <strong>bold</strong></p>");
  });

  it("submits an emptied editor as an empty string, like a textarea", async () => {
    const { editor, onChange } = await renderEditor("<p>Some text</p>");

    act(() => {
      editor.commands.clearContent(true);
    });

    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("emits sanitised HTML on edit", async () => {
    const { editor, onChange } = await renderEditor("<p>Hello</p>");

    act(() => {
      editor.commands.insertContentAt(editor.state.doc.content.size - 1, "!");
    });

    expect(onChange).toHaveBeenLastCalledWith("<p>Hello!</p>");
  });

  it.each([
    ["bold", "<p><strong>Hello</strong> world</p>"],
    ["italic", "<p><em>Hello</em> world</p>"],
    ["heading", "<h3>Hello world</h3>"],
    ["subheading", "<h4>Hello world</h4>"],
    ["bulletList", "<ul><li><p>Hello world</p></li></ul>"],
    ["orderedList", "<ol><li><p>Hello world</p></li></ol>"],
  ])("applies %s from the toolbar", async (key, expected) => {
    const { editor, onChange } = await renderEditor("<p>Hello world</p>");
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    fireEvent.click(button(key));

    expect(onChange).toHaveBeenLastCalledWith(expected);
  });

  it("marks active formatting with aria-pressed", async () => {
    const { editor } = await renderEditor("<p><strong>Hello</strong></p>");
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    expect(button("bold")).toHaveAttribute("aria-pressed", "true");
    expect(button("italic")).toHaveAttribute("aria-pressed", "false");
    expect(button("undo")).not.toHaveAttribute("aria-pressed");
  });

  it("undoes and redoes from the toolbar", async () => {
    const { editor, onChange } = await renderEditor("<p>Hello</p>");
    expect(button("undo")).toHaveAttribute("aria-disabled", "true");
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });
    fireEvent.click(button("bold"));
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong></p>");

    fireEvent.click(button("undo"));
    expect(onChange).toHaveBeenLastCalledWith("<p>Hello</p>");

    fireEvent.click(button("redo"));
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong></p>");
  });

  // jsdom reports no Mac platform, so ProseMirror reads "Mod" as Ctrl.
  it("toggles bold with the Mod-B shortcut", async () => {
    const { editor, textbox, onChange } = await renderEditor("<p>Hello</p>");
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 6 });
    });

    fireEvent.keyDown(textbox, { key: "b", ctrlKey: true });

    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong></p>");
  });

  it("is a roving-focus toolbar: one Tab stop, arrow keys move", async () => {
    await renderEditor();
    const toolbar = screen.getByRole("toolbar", { name: "toolbar" });
    const buttons = screen.getAllByRole("button");
    expect(buttons.filter((b) => b.tabIndex === 0)).toEqual([buttons[0]]);

    buttons[0]?.focus();
    fireEvent.keyDown(toolbar, { key: "ArrowRight" });
    expect(buttons[1]).toHaveFocus();
    fireEvent.keyDown(toolbar, { key: "ArrowLeft" });
    fireEvent.keyDown(toolbar, { key: "ArrowLeft" });
    expect(buttons.at(-1)).toHaveFocus();
    fireEvent.keyDown(toolbar, { key: "Home" });
    expect(buttons[0]).toHaveFocus();
  });

  describe("paste", () => {
    const paste = (editor: Editor, html: string) =>
      act(() => {
        // jsdom has no ClipboardEvent; ProseMirror only needs an event object.
        editor.view.pasteHTML(html, new Event("paste") as ClipboardEvent);
      });

    it("keeps allowed formatting and drops the rest", async () => {
      const { editor, onChange } = await renderEditor();

      paste(
        editor,
        '<h1 style="color:red">Big</h1><p><b>bold</b> <span class="x">and</span> <u>under</u> <img src="a.png"></p><table><tr><td>cell</td></tr></table>'
      );

      expect(onChange).toHaveBeenLastCalledWith(
        "<p>Big</p><p><strong>bold</strong> and under</p><p>cell</p>"
      );
    });

    it("keeps a web link as plain text", async () => {
      const { editor, onChange } = await renderEditor();

      paste(
        editor,
        '<p>See <a href="https://example.com">the site</a> or <a href="javascript:alert(1)">this</a></p>'
      );

      expect(onChange).toHaveBeenLastCalledWith("<p>See the site or this</p>");
    });

    it("keeps a record link in the stored shape", async () => {
      const { editor, onChange } = await renderEditor();

      paste(
        editor,
        '<p>Ask <a data-record-domain="npc" data-record-id="42">Mira</a> and <a data-record-domain="nope" data-record-id="1">Bob</a></p>'
      );

      expect(onChange).toHaveBeenLastCalledWith(
        '<p>Ask <a data-record-domain="npc" data-record-id="42">Mira</a> and Bob</p>'
      );
    });
  });

  it("does not turn typed Markdown into formatting", async () => {
    const { editor, onChange } = await renderEditor();

    // Input rules fire on typed text (`handleTextInput`), not on commands:
    // type the closing "*" of "**bold**" and the "- " of a list item.
    const type = (text: string) =>
      act(() => {
        const { from, to } = editor.state.selection;
        const handled = editor.view.someProp("handleTextInput", (handler) =>
          handler(editor.view, from, to, text, () => editor.state.tr)
        );
        if (handled !== true) editor.commands.insertContent(text);
      });
    act(() => {
      editor.commands.insertContent("**bold*");
    });
    type("*");
    type(" -");
    type(" ");

    expect(onChange).toHaveBeenLastCalledWith("<p>**bold** - </p>");
  });

  it("removes a record link from the toolbar", async () => {
    const { editor, onChange } = await renderEditor(
      '<p><a data-record-domain="npc" data-record-id="42">Mira</a> waits</p>'
    );
    expect(button("unlink")).toHaveAttribute("aria-disabled", "true");
    act(() => {
      editor.commands.setTextSelection(2);
    });

    expect(button("unlink")).toHaveAttribute("aria-disabled", "false");
    fireEvent.click(button("unlink"));

    expect(onChange).toHaveBeenLastCalledWith("<p>Mira waits</p>");
  });

  it("loads an outside value change without echoing it back", async () => {
    const onChange = vi.fn();
    const { rerender, editor } = await renderEditor("<p>One</p>", onChange);

    rerender(
      <RichTextInput
        value="<p>Two</p>"
        onChange={onChange}
        label="Description"
      />
    );

    expect(editor.getHTML()).toBe("<p>Two</p>");
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("record links (T4)", () => {
    const emptyGroup = { total: 0, items: [] };

    it("offers the link button only with text selected", async () => {
      const { editor } = await renderEditor("<p>Ask Mira</p>");
      expect(button("link")).toHaveAttribute("aria-disabled", "true");

      fireEvent.click(button("link"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      act(() => {
        editor.commands.setTextSelection({ from: 5, to: 9 });
      });
      expect(button("link")).toHaveAttribute("aria-disabled", "false");
    });

    it("links the selection to the record chosen in the picker", async () => {
      searchRecordLinks.mockResolvedValue({
        spells: emptyGroup,
        magicItems: emptyGroup,
        npc: { total: 1, items: [{ id: 42, name: "Mira" }] },
        deities: emptyGroup,
        factions: emptyGroup,
        places: emptyGroup,
        dhDomains: emptyGroup,
        dhDomainCards: emptyGroup,
        dhClasses: emptyGroup,
        dhSubclasses: emptyGroup,
      });
      const { editor, onChange } = await renderEditor("<p>Ask Mira</p>");
      act(() => {
        editor.commands.setTextSelection({ from: 5, to: 9 });
      });

      fireEvent.click(button("link"));
      fireEvent.change(await screen.findByLabelText("searchLabel"), {
        target: { value: "mira" },
      });
      fireEvent.click(await screen.findByRole("button", { name: "Mira" }));

      expect(onChange).toHaveBeenLastCalledWith(
        '<p>Ask <a data-record-domain="npc" data-record-id="42">Mira</a></p>'
      );
      expect(screen.queryByLabelText("searchLabel")).not.toBeInTheDocument();
    });
  });

  describe("deleted link targets (T5)", () => {
    const stored =
      '<p><a data-record-domain="npc" data-record-id="1">Mira</a> and ' +
      '<a data-record-domain="npc" data-record-id="2">Tobin</a></p>';

    it("opens a link the page reports deleted as plain text", async () => {
      render(
        <DeletedRecordLinksContext.Provider value={new Set(["npc:2"])}>
          <RichTextInput value={stored} onChange={vi.fn()} label="D" />
        </DeletedRecordLinksContext.Provider>
      );
      const textbox = await screen.findByRole("textbox");
      const editor = (textbox as unknown as { editor: Editor }).editor;

      expect(editor.getHTML()).toBe(
        '<p><a data-record-domain="npc" data-record-id="1">Mira</a> and Tobin</p>'
      );
    });

    it("unlinks a deletion reported after mount, before the DM types", async () => {
      const onChange = vi.fn();
      const view = (deleted: ReadonlySet<string>) => (
        <DeletedRecordLinksContext.Provider value={deleted}>
          <RichTextInput value={stored} onChange={onChange} label="D" />
        </DeletedRecordLinksContext.Provider>
      );
      const { rerender } = render(view(new Set()));
      const textbox = await screen.findByRole("textbox");
      const editor = (textbox as unknown as { editor: Editor }).editor;
      expect(editor.getHTML()).toContain('data-record-id="2"');

      rerender(view(new Set(["npc:2"])));

      expect(editor.getHTML()).not.toContain('data-record-id="2"');
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
