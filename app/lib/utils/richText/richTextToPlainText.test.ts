import { describe, expect, it } from "vitest";

import richTextToPlainText from "./richTextToPlainText";

describe("richTextToPlainText", () => {
  it("returns legacy plain text unchanged", () => {
    expect(richTextToPlainText("a <strong> b\nc")).toBe("a <strong> b\nc");
  });

  it("reduces formatted text to its words, one line per block", () => {
    expect(
      richTextToPlainText(
        '<h3>Title</h3><p>A <strong>bold</strong> <a data-record-domain="npc" data-record-id="1">Mira</a><br>next</p><ul><li>one</li><li>two</li></ul>'
      )
    ).toBe("Title\nA bold Mira\nnext\none\ntwo");
  });

  it("decodes entities and never includes tag names", () => {
    const text = richTextToPlainText("<p>Fish &amp; <em>chips</em></p>");

    expect(text).toBe("Fish & chips");
    expect(text).not.toMatch(/em|<|>/);
  });

  it("drops script content", () => {
    expect(richTextToPlainText("<p>a</p><script>secret()</script>")).toBe("a");
  });
});
