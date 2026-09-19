import { describe, expect, it } from "vitest";

import editorHtmlToRichText from "./editorHtmlToRichText";

describe("editorHtmlToRichText", () => {
  it("submits an empty editor as an empty string, like an emptied textarea", () => {
    expect(editorHtmlToRichText("<p></p>")).toBe("");
    expect(editorHtmlToRichText("<p>  </p><ul><li><p></p></li></ul>")).toBe("");
  });

  it("keeps allowed formatting and record links", () => {
    const html =
      '<h3>Title</h3><p><strong>Bold</strong> and <a data-record-domain="npc" data-record-id="42">Mira</a></p>';
    expect(editorHtmlToRichText(html)).toBe(html);
  });

  it("strips anything outside the allowlist", () => {
    expect(
      editorHtmlToRichText(
        '<p class="x">Text <a href="https://example.com">web</a></p>'
      )
    ).toBe("<p>Text web</p>");
  });
});
