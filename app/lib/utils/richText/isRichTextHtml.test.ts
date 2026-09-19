import { describe, expect, it } from "vitest";

import isRichTextHtml from "./isRichTextHtml";

describe("isRichTextHtml", () => {
  it.each([
    "<p>x</p>",
    "  \n<p>x</p>",
    "<ul><li>x</li></ul>",
    "<ol><li>x</li></ol>",
    "<h3>x</h3>",
    "<h4>x</h4>",
    '<P class="x">x</P>',
  ])("treats %j as formatted text", (value) => {
    expect(isRichTextHtml(value)).toBe(true);
  });

  it.each([
    "",
    "plain description",
    "line one\nline two",
    "<3 the dragon",
    "<b>bold first</b>",
    "<script>alert(1)</script>",
    "<pre>x</pre>",
    "<h1>x</h1>",
    "text then <p>x</p>",
  ])("treats %j as legacy plain text", (value) => {
    expect(isRichTextHtml(value)).toBe(false);
  });
});
