import { describe, expect, it } from "vitest";

import richTextValidator from "./richTextValidator";

describe("richTextValidator (SPEC-019 T5)", () => {
  const validator = richTextValidator();

  it("sanitises formatted text on the way through", () => {
    expect(
      validator.parse(
        '<p onclick="x()">Hi <strong>there</strong><script>alert(1)</script>' +
          '<a href="javascript:alert(1)">bad</a></p>'
      )
    ).toBe("<p>Hi <strong>there</strong>bad</p>");
  });

  it("keeps a record link and drops an external one", () => {
    expect(
      validator.parse(
        '<p><a data-record-domain="npc" data-record-id="4">Mira</a>' +
          '<a href="https://example.com">web</a></p>'
      )
    ).toBe('<p><a data-record-domain="npc" data-record-id="4">Mira</a>web</p>');
  });

  it("turns formatted text with no words left into an empty value", () => {
    expect(validator.parse("<p><script>x</script></p>")).toBe("");
  });

  it("passes legacy plain text through untouched, entities and all", () => {
    expect(validator.parse("Tom & Jerry <3\nline two")).toBe(
      "Tom & Jerry <3\nline two"
    );
  });

  it("still refuses a non-string", () => {
    expect(validator.safeParse(42).success).toBe(false);
  });
});
