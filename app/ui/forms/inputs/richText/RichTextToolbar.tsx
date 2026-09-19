"use client";

import {
  ComponentType,
  KeyboardEvent,
  SVGProps,
  useRef,
  useState,
} from "react";
import { Editor, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BoldIcon,
  H1Icon,
  H2Icon,
  ItalicIcon,
  LinkIcon,
  LinkSlashIcon,
  ListBulletIcon,
  NumberedListIcon,
} from "@heroicons/react/20/solid";

interface ToolbarAction {
  key: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Present on toggles only: drives `aria-pressed`. */
  active?: boolean;
  enabled: boolean;
  run: () => void;
}

interface RichTextToolbarProps {
  editor: Editor;
  /** Opens the record-link picker (T4); the link button is absent without it. */
  onRequestLink?: () => void;
}

/**
 * The formatted-text editor's toolbar (SPEC-019 §5.2): bold, italic, bulleted
 * and numbered lists, two heading levels (stored as `h3`/`h4`, shown as the
 * description's own first and second level), link to a record, remove link,
 * undo, redo.
 *
 * A WAI-ARIA toolbar: one Tab stop, arrow keys (and Home/End) move between
 * buttons — a roving `tabIndex`. Unavailable buttons stay focusable with
 * `aria-disabled` rather than `disabled`, so arrowing never skips over one
 * silently. Hand-rolled buttons rather than `BaseButton`: no variant is an
 * icon toggle with `aria-pressed` (the TD-117 carve-out).
 */
export default function RichTextToolbar({
  editor,
  onRequestLink,
}: RichTextToolbarProps) {
  const t = useTranslations("common.richText");
  const [focusIndex, setFocusIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      heading3: current.isActive("heading", { level: 3 }),
      heading4: current.isActive("heading", { level: 4 }),
      recordLink: current.isActive("recordLink"),
      hasSelection: !current.state.selection.empty,
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  const actions: ToolbarAction[] = [
    {
      key: "bold",
      Icon: BoldIcon,
      active: state.bold,
      enabled: true,
      run: () => chain().toggleBold().run(),
    },
    {
      key: "italic",
      Icon: ItalicIcon,
      active: state.italic,
      enabled: true,
      run: () => chain().toggleItalic().run(),
    },
    {
      key: "bulletList",
      Icon: ListBulletIcon,
      active: state.bulletList,
      enabled: true,
      run: () => chain().toggleBulletList().run(),
    },
    {
      key: "orderedList",
      Icon: NumberedListIcon,
      active: state.orderedList,
      enabled: true,
      run: () => chain().toggleOrderedList().run(),
    },
    {
      key: "heading",
      Icon: H1Icon,
      active: state.heading3,
      enabled: true,
      run: () => chain().toggleHeading({ level: 3 }).run(),
    },
    {
      key: "subheading",
      Icon: H2Icon,
      active: state.heading4,
      enabled: true,
      run: () => chain().toggleHeading({ level: 4 }).run(),
    },
    ...(onRequestLink === undefined
      ? []
      : [
          {
            key: "link",
            Icon: LinkIcon,
            active: state.recordLink,
            enabled: state.hasSelection,
            run: onRequestLink,
          },
        ]),
    {
      key: "unlink",
      Icon: LinkSlashIcon,
      enabled: state.recordLink,
      run: () => chain().unsetRecordLink().run(),
    },
    {
      key: "undo",
      Icon: ArrowUturnLeftIcon,
      enabled: state.canUndo,
      run: () => chain().undo().run(),
    },
    {
      key: "redo",
      Icon: ArrowUturnRightIcon,
      enabled: state.canRedo,
      run: () => chain().redo().run(),
    },
  ];

  const moveFocus = (index: number) => {
    const next = (index + actions.length) % actions.length;
    setFocusIndex(next);
    buttonRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: focusIndex + 1,
      ArrowLeft: focusIndex - 1,
      Home: 0,
      End: actions.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    moveFocus(target);
  };

  return (
    <div
      role="toolbar"
      aria-label={t("toolbar")}
      onKeyDown={onKeyDown}
      className="flex flex-wrap gap-1 border-b border-gray-200 p-1"
    >
      {actions.map((action, index) => (
        <button
          key={action.key}
          ref={(element) => {
            buttonRefs.current[index] = element;
          }}
          type="button"
          tabIndex={index === focusIndex ? 0 : -1}
          aria-label={t(action.key)}
          title={t(action.key)}
          aria-pressed={action.active}
          aria-disabled={!action.enabled}
          // Keeps the editor's selection: the click must not blur it first.
          onMouseDown={(event) => event.preventDefault()}
          onFocus={() => setFocusIndex(index)}
          onClick={() => {
            if (action.enabled) action.run();
          }}
          className={clsx(
            "rounded p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            action.active === true
              ? "bg-indigo-100 text-indigo-800"
              : "text-gray-700 hover:bg-gray-100",
            !action.enabled && "cursor-not-allowed opacity-40"
          )}
        >
          <action.Icon aria-hidden="true" className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
