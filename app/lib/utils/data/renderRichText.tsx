import { ReactNode } from "react";

/**
 * Renders a description field's stored text (TD-76). Every consumer of this
 * is a plain `Textarea` control — nothing in the app authors real HTML — so
 * this renders `datum` as text, not markup: JSX's `{datum}` escapes it,
 * `whitespace-pre-wrap` preserves the line breaks the DM typed without
 * injecting `<br>` markup. Markdown authoring is a separate, later feature
 * (ROADMAP.md Phase 5) that will replace this function's body entirely.
 */
const renderRichText = (datum: string): ReactNode => (
  <div className="whitespace-pre-wrap">{datum}</div>
);

export default renderRichText;
