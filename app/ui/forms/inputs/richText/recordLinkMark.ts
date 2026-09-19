import { Mark } from "@tiptap/core";

import type RecordLinkDomain from "@/app/lib/definitions/types/RecordLinkDomain";
import parseRecordLink from "@/app/lib/utils/richText/parseRecordLink";
import {
  RECORD_DOMAIN_ATTRIBUTE,
  RECORD_ID_ATTRIBUTE,
} from "@/app/lib/utils/richText/richTextAllowlist";

export interface RecordLinkAttributes {
  domain: RecordLinkDomain;
  id: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    recordLink: {
      /** Links the selection to a record (SPEC-019 §5.3). */
      setRecordLink: (attributes: RecordLinkAttributes) => ReturnType;
      /** Unwraps the record link around the cursor or selection. */
      unsetRecordLink: () => ReturnType;
    };
  }
}

const readRecordLink = (element: HTMLElement) =>
  parseRecordLink({
    [RECORD_DOMAIN_ATTRIBUTE]:
      element.getAttribute(RECORD_DOMAIN_ATTRIBUTE) ?? undefined,
    [RECORD_ID_ATTRIBUTE]:
      element.getAttribute(RECORD_ID_ATTRIBUTE) ?? undefined,
  });

/**
 * The record-link mark (SPEC-019, ADR-0016), in exactly the stored shape the
 * sanitiser keeps: `<a data-record-domain="npc" data-record-id="42">`, no
 * `href`. It parses only anchors `parseRecordLink` accepts, so a pasted web
 * link — or a record link with an unknown domain or a malformed id — is not
 * a mark at all and arrives as plain text. Tiptap's own `Link` extension is
 * not used: it models `href`, which this format never stores.
 */
const recordLinkMark = Mark.create({
  name: "recordLink",
  // Typing at a link's edge does not extend it.
  inclusive: false,

  addAttributes() {
    return {
      domain: {
        default: null,
        parseHTML: (element) => readRecordLink(element)?.domain ?? null,
        renderHTML: (attributes) => ({
          [RECORD_DOMAIN_ATTRIBUTE]: String(attributes.domain),
        }),
      },
      id: {
        default: null,
        parseHTML: (element) => readRecordLink(element)?.id ?? null,
        renderHTML: (attributes) => ({
          [RECORD_ID_ATTRIBUTE]: String(attributes.id),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `a[${RECORD_DOMAIN_ATTRIBUTE}][${RECORD_ID_ATTRIBUTE}]`,
        // `false` rejects the anchor: its text stays, the link goes.
        getAttrs: (element) =>
          readRecordLink(element) === null ? false : null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["a", HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setRecordLink:
        (attributes) =>
        ({ commands }) =>
          commands.setMark(this.name, attributes),
      unsetRecordLink:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name, { extendEmptyMarkRange: true }),
    };
  },
});

export default recordLinkMark;
