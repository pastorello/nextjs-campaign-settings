import { render } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import RecordLinkTargetsProvider from "@/app/ui/richText/RecordLinkTargetsProvider";
import type RecordLinkTargets from "@/app/lib/definitions/types/RecordLinkTargets";
import renderRichText from "./renderRichText";

const renderWith = (datum: string, targets?: RecordLinkTargets) =>
  render(
    targets ? (
      <RecordLinkTargetsProvider targets={targets}>
        {renderRichText(datum)}
      </RecordLinkTargetsProvider>
    ) : (
      <>{renderRichText(datum)}</>
    )
  );

describe("renderRichText — legacy plain text (TD-76)", () => {
  // Before SPEC-019 this used `<p>Hello</p>`; a value opening with `<p>` is
  // now formatted text by definition (ADR-0016), so the plain-text case uses
  // markup that does not open with a block element.
  it("renders HTML-looking text literally rather than as markup", () => {
    const { container } = renderWith("<b>Hello</b> <p>there</p>");

    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector("p")).toBeNull();
    expect(container.textContent).toBe("<b>Hello</b> <p>there</p>");
  });

  it("never executes markup typed into a plain-text field", () => {
    const { container } = renderWith(
      '<img src=x onerror="window.__pwned = true">'
    );

    expect(container.querySelector("img")).toBeNull();
    expect(
      (window as unknown as { __pwned?: boolean }).__pwned
    ).toBeUndefined();
  });

  it("preserves line breaks visually via CSS, not by injecting <br> markup", () => {
    const { container } = renderWith("first line\nsecond line");

    expect(container.textContent).toBe("first line\nsecond line");
    expect(container.querySelector("br")).toBeNull();
    expect(container.firstElementChild).toHaveClass("whitespace-pre-wrap");
  });
});

describe("renderRichText — formatted text (SPEC-019 T2)", () => {
  it("renders the allowed elements as real elements", () => {
    const { container } = renderWith(
      "<h3>Title</h3><p>A <strong>bold</strong> and <em>italic</em><br>line</p><ul><li>one</li></ul><ol><li>two</li></ol><h4>Sub</h4>"
    );

    expect(container.querySelector("h3")).toHaveTextContent("Title");
    expect(container.querySelector("h4")).toHaveTextContent("Sub");
    expect(container.querySelector("p strong")).toHaveTextContent("bold");
    expect(container.querySelector("p em")).toHaveTextContent("italic");
    expect(container.querySelector("p br")).not.toBeNull();
    expect(container.querySelector("ul")).toHaveClass("list-disc");
    expect(container.querySelector("ol li")).toHaveTextContent("two");
    expect(container.firstElementChild).not.toHaveClass("whitespace-pre-wrap");
  });

  it("decodes entities into text instead of markup", () => {
    const { container } = renderWith("<p>Fish &amp; &lt;chips&gt;</p>");

    expect(container.querySelector("p")).toHaveTextContent("Fish & <chips>");
    expect(container.querySelector("chips")).toBeNull();
  });

  it("sanitises a hostile stored value again on render", () => {
    const { container } = renderWith(
      '<p onclick="window.__pwned = true" class="x">ok</p>' +
        '<img src=x onerror="window.__pwned = true">' +
        "<script>window.__pwned = true</script>" +
        '<iframe src="javascript:window.__pwned = true"></iframe>' +
        '<a href="javascript:window.__pwned = true">click</a>'
    );

    expect(container.querySelector("img, script, iframe, a")).toBeNull();
    const paragraph = container.querySelector("p");
    expect(paragraph).not.toBeNull();
    expect(paragraph!.getAttribute("onclick")).toBeNull();
    expect(paragraph!.getAttribute("class")).toBeNull();
    expect(container.textContent).toBe("okclick");
    expect(
      (window as unknown as { __pwned?: boolean }).__pwned
    ).toBeUndefined();
  });

  it("links a record to its page under the current system, by its current name", () => {
    const { container } = renderWith(
      '<p>Ask <a data-record-domain="npc" data-record-id="42">the priest</a>.</p>',
      { "npc:42": "Mira Vale" }
    );

    const link = container.querySelector("a");
    expect(link).toHaveTextContent("the priest");
    expect(link).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/npc?query=Mira%20Vale"
    );
  });

  it("links a place to its map", () => {
    const { container } = renderWith(
      '<p><a data-record-domain="places" data-record-id="3">Aerivel</a></p>',
      { "places:3": "Aerivel" }
    );

    expect(container.querySelector("a")).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/geography?place=3"
    );
  });

  it("renders a link to a deleted record as plain text", () => {
    const { container } = renderWith(
      '<p>Ask <a data-record-domain="npc" data-record-id="42">the priest</a>.</p>',
      { "npc:7": "Someone else" }
    );

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("Ask the priest.");
  });

  it("renders links as plain text when the page resolved none", () => {
    const { container } = renderWith(
      '<p><a data-record-domain="npc" data-record-id="42">Mira</a></p>'
    );

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("Mira");
  });
});
