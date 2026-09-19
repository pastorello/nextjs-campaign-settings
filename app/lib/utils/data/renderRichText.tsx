import { ReactNode } from "react";

import isRichTextHtml from "../richText/isRichTextHtml";
import richTextToReact from "../richText/richTextToReact";

/**
 * Renders a description field's stored value (SPEC-019 T2, ADR-0016).
 *
 * - **Legacy plain text** (every row written before SPEC-019) renders exactly
 *   as TD-76 left it: JSX's `{datum}` escapes it, `whitespace-pre-wrap` keeps
 *   the DM's line breaks without injecting `<br>` markup.
 * - **Formatted text** (it opens with `p`/`ul`/`ol`/`h3`/`h4`) is sanitised
 *   again, whatever the write path did, and rebuilt as React elements from the
 *   allowlist; record links resolve through `RecordLinkTargetsProvider`.
 *
 * Synchronous and client-safe on purpose: this is a `getDatum`, called from
 * client components (the `*Library` lists) as well as server ones, so it
 * never touches the database. Which linked records exist is resolved per page
 * by `fetchRecordLinkTargets`; without that, links render as their text.
 */
const renderRichText = (datum: string): ReactNode =>
  isRichTextHtml(datum) ? (
    <div className="space-y-2">{richTextToReact(datum)}</div>
  ) : (
    <div className="whitespace-pre-wrap">{datum}</div>
  );

export default renderRichText;
