"use client";

import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import clsx from "clsx";

import MetaValue from "@/app/lib/definitions/types/MetaValue";
import isValidString from "@/app/lib/utils/validators/isValidString";
import richTextToEditorContent from "@/app/lib/utils/richText/richTextToEditorContent";
import editorHtmlToRichText from "@/app/lib/utils/richText/editorHtmlToRichText";

import RichTextToolbar from "./richText/RichTextToolbar";
import type { RecordLinkAttributes } from "./richText/recordLinkMark";
import richTextExtensions from "./richText/richTextExtensions";

/**
 * Loaded on first open: the picker pulls in the search Server Action (and,
 * under Vitest, the auth module behind it), which every form that merely
 * renders this input has no reason to load.
 */
const RecordLinkPicker = lazy(() => import("./richText/RecordLinkPicker"));

interface RichTextInputProps {
  // See TextInput: every control takes MetaValue and narrows it itself.
  value: MetaValue;
  label: string;
  onChange: (value: MetaValue) => void;
  placeholder?: string;
  /** See `PageMeta.tall` (TD-120) — a taller box for long-form content. */
  tall?: boolean;
}

/**
 * The formatted-text control (SPEC-019 T3, ADR-0016): a Tiptap editor with a
 * toolbar, a drop-in for `TextareaInput` — same props, same `onChange(string)`
 * contract — so it works in `EntityForm` through `InputComponent` and in the
 * ADR-0011 bespoke editors alike.
 *
 * - **In:** a stored value is opened with `richTextToEditorContent` — legacy
 *   plain text becomes one paragraph per line, formatted text is sanitised.
 *   Nothing is emitted until the DM edits, so an untouched plain-text row
 *   stays plain text.
 * - **Out:** every edit emits `editorHtmlToRichText(editor.getHTML())` — the
 *   sanitised fragment, or `""` for an editor with no text, exactly as an
 *   emptied textarea.
 * - **Markdown:** input and paste rules are off (SPEC-019 §3): typing
 *   `**bold**` or `- ` does nothing special. Shortcuts (Mod-B/I/Z) stay.
 * - **Record links (T4):** the link button opens `RecordLinkPicker` on the
 *   current selection; "remove link" unwraps the link under the cursor.
 * - **SSR:** `immediatelyRender: false`, as Tiptap requires under Next —
 *   the editor mounts on the client after hydration.
 */
const RichTextInput = ({
  value,
  label,
  onChange,
  placeholder,
  tall,
}: RichTextInputProps) => {
  const labelId = useId();
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const stringValue = typeof value === "string" ? value : "";

  // The last value this editor emitted: a `value` prop equal to it is our own
  // echo, anything else is an outside reset to load.
  const lastEmitted = useRef(stringValue);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: richTextExtensions(
      isValidString(placeholder) ? placeholder : ""
    ),
    content: richTextToEditorContent(stringValue),
    immediatelyRender: false,
    enableInputRules: false,
    enablePasteRules: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        ...(isValidString(label) ? { "aria-labelledby": labelId } : {}),
        class: clsx(
          "overflow-y-auto px-[5px] py-1 focus:outline-none focus:bg-blue-100",
          tall ? "h-[280px]" : "h-[150px]",
          "space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_h3]:text-base [&_h3]:font-semibold [&_h4]:text-sm [&_h4]:font-semibold [&_strong]:font-semibold",
          "[&_a]:text-blue-700 [&_a]:underline",
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-gray-400 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
        ),
      },
    },
    onUpdate: ({ editor: current }) => {
      const next = editorHtmlToRichText(current.getHTML());
      if (next === lastEmitted.current) return;
      lastEmitted.current = next;
      onChangeRef.current(next);
    },
  });

  useEffect(() => {
    if (editor === null || stringValue === lastEmitted.current) return;
    lastEmitted.current = stringValue;
    editor.commands.setContent(richTextToEditorContent(stringValue), {
      emitUpdate: false,
    });
  }, [editor, stringValue]);

  // The editor keeps its selection while the dialog has focus, so the link
  // lands on the text that was selected when the button was pressed.
  const linkSelection = (link: RecordLinkAttributes) => {
    setLinkPickerOpen(false);
    editor?.chain().focus().setRecordLink(link).run();
  };

  return (
    <div className="w-full">
      {isValidString(label) && (
        <div
          id={labelId}
          className="mb-[10px] text-sm font-medium text-gray-900"
        >
          {label}
        </div>
      )}
      <div className="rounded-md border hover:shadow">
        {editor !== null && (
          <RichTextToolbar
            editor={editor}
            onRequestLink={() => setLinkPickerOpen(true)}
          />
        )}
        <EditorContent editor={editor} />
      </div>
      {/* Mounted only while open: it reads the route's game system, and
          nothing about it is worth keeping between openings. */}
      {linkPickerOpen && (
        <Suspense fallback={null}>
          <RecordLinkPicker
            isOpen={linkPickerOpen}
            setIsOpen={setLinkPickerOpen}
            onChoose={linkSelection}
          />
        </Suspense>
      )}
    </div>
  );
};

export default RichTextInput;
