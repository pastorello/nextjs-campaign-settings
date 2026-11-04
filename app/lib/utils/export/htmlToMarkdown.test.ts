import { describe, expect, it } from "vitest";

import htmlToMarkdown, { plainTextToMarkdown } from "./htmlToMarkdown";
import { RICH_TEXT_TAGS } from "../richText/richTextAllowlist";

const link = (id: number, text: string) =>
  `<a data-record-domain="npc" data-record-id="${id}">${text}</a>`;

describe("htmlToMarkdown (SPEC-033 T1)", () => {
  describe("every element of the ADR-0016 allowlist", () => {
    it("separates paragraphs with a blank line", () => {
      expect(htmlToMarkdown("<p>One.</p><p>Two.</p>")).toBe("One.\n\nTwo.");
    });

    it("turns a <br> into a hard break", () => {
      expect(htmlToMarkdown("<p>One<br>two</p>")).toBe("One\\\ntwo");
    });

    it("writes strong and em as ** and *", () => {
      expect(
        htmlToMarkdown("<p><strong>bold</strong> and <em>soft</em></p>")
      ).toBe("**bold** and *soft*");
    });

    it("moves whitespace inside emphasis outside its markers", () => {
      expect(htmlToMarkdown("<p>a<strong> b </strong>c</p>")).toBe("a **b** c");
    });

    it("drops emphasis that holds nothing", () => {
      expect(htmlToMarkdown("<p>a<strong> </strong>b</p>")).toBe("a b");
    });

    it("writes h3 and h4 as ### and ####", () => {
      expect(htmlToMarkdown("<h3>Lair</h3><h4>Actions</h4><p>x</p>")).toBe(
        "### Lair\n\n#### Actions\n\nx"
      );
    });

    it("writes an unordered list with dashes", () => {
      expect(
        htmlToMarkdown("<ul><li><p>a</p></li><li><p>b</p></li></ul>")
      ).toBe("- a\n- b");
    });

    it("numbers an ordered list from one", () => {
      expect(
        htmlToMarkdown("<ol><li><p>a</p></li><li><p>b</p></li></ol>")
      ).toBe("1. a\n2. b");
    });

    it("indents a nested list under its item", () => {
      expect(
        htmlToMarkdown(
          "<ul><li><p>a</p><ol><li><p>x</p></li><li><p>y</p></li></ol></li><li><p>b</p></li></ul>"
        )
      ).toBe("- a\n  1. x\n  2. y\n- b");
    });

    it("writes a record link as its text, the record's name", () => {
      expect(htmlToMarkdown(`<p>Ask ${link(3, "Mirela")}.</p>`)).toBe(
        "Ask Mirela."
      );
    });

    it("covers every tag the allowlist declares", () => {
      // A tag added to the allowlist without a case here fails this test
      // first: the converter would otherwise reduce it to its text silently.
      expect([...RICH_TEXT_TAGS].sort()).toEqual(
        ["a", "br", "em", "h3", "h4", "li", "ol", "p", "strong", "ul"].sort()
      );
    });
  });

  describe("what the DM wrote stays text", () => {
    it("escapes characters Markdown would read as syntax", () => {
      expect(htmlToMarkdown("<p>2*3 = _six_ [sic] &lt;b&gt; `x`</p>")).toBe(
        "2\\*3 = \\_six\\_ \\[sic\\] \\<b\\> \\`x\\`"
      );
    });

    it("keeps a line from opening a heading or a list", () => {
      expect(htmlToMarkdown("<p># one<br>- two<br>3. three</p>")).toBe(
        "\\# one\\\n\\- two\\\n3\\. three"
      );
    });

    it("decodes entities", () => {
      expect(htmlToMarkdown("<p>Tom &amp; Jerry</p>")).toBe("Tom & Jerry");
    });

    it("collapses HTML whitespace", () => {
      expect(htmlToMarkdown("<p>a\n   b</p>")).toBe("a b");
    });

    it("drops markup the sanitiser refuses", () => {
      expect(
        htmlToMarkdown('<p>a<script>alert(1)</script><img src="x">b</p>')
      ).toBe("ab");
    });

    it("leaves empty paragraphs out", () => {
      expect(htmlToMarkdown("<p></p><p>x</p><p> </p>")).toBe("x");
    });
  });

  describe("legacy plain text (written before SPEC-019)", () => {
    it("keeps paragraphs and line breaks", () => {
      expect(htmlToMarkdown("One\ntwo\n\nThree")).toBe("One\\\ntwo\n\nThree");
    });

    it("escapes it like formatted text", () => {
      expect(plainTextToMarkdown("- not a list *really*")).toBe(
        "\\- not a list \\*really\\*"
      );
    });

    it("is empty for an empty value", () => {
      expect(htmlToMarkdown("")).toBe("");
      expect(htmlToMarkdown("  \n\n ")).toBe("");
    });
  });
});
