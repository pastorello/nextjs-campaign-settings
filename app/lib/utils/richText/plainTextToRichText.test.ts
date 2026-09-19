import { describe, expect, it } from "vitest";

import isRichTextHtml from "./isRichTextHtml";
import plainTextToRichText from "./plainTextToRichText";

describe("plainTextToRichText", () => {
  it("turns each line into an escaped paragraph", () => {
    expect(plainTextToRichText("first & <one>\nsecond\r\n\nfourth")).toBe(
      "<p>first &amp; &lt;one&gt;</p><p>second</p><p></p><p>fourth</p>"
    );
  });

  it("keeps empty text empty", () => {
    expect(plainTextToRichText("")).toBe("");
  });

  it("round-trips: its output is recognised as formatted text", () => {
    expect(isRichTextHtml(plainTextToRichText("a"))).toBe(true);
  });
});
