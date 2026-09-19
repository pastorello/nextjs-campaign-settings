import { describe, expect, it } from "vitest";

import richTextToEditorContent from "./richTextToEditorContent";

describe("richTextToEditorContent", () => {
  it("turns legacy plain text into one paragraph per line", () => {
    expect(richTextToEditorContent("First line\nSecond <line>")).toBe(
      "<p>First line</p><p>Second &lt;line&gt;</p>"
    );
  });

  it("keeps an empty value empty", () => {
    expect(richTextToEditorContent("")).toBe("");
  });

  it("sanitises stored formatted text before the editor sees it", () => {
    expect(
      richTextToEditorContent(
        '<p onclick="x()">Hi <strong>there</strong><script>alert(1)</script></p>'
      )
    ).toBe("<p>Hi <strong>there</strong></p>");
  });
});
