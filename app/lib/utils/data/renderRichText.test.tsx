import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import renderRichText from "./renderRichText";

describe("renderRichText (TD-76)", () => {
  it("renders HTML-looking text literally rather than as markup", () => {
    const { container } = render(<>{renderRichText("<p>Hello</p>")}</>);

    expect(container.querySelector("p")).toBeNull();
    expect(container.textContent).toBe("<p>Hello</p>");
  });

  it("never executes markup typed into a plain-text field", () => {
    const { container } = render(
      <>{renderRichText('<img src=x onerror="window.__pwned = true">')}</>
    );

    expect(container.querySelector("img")).toBeNull();
    expect(
      (window as unknown as { __pwned?: boolean }).__pwned
    ).toBeUndefined();
  });

  it("preserves line breaks visually via CSS, not by injecting <br> markup", () => {
    const { container } = render(
      <>{renderRichText("first line\nsecond line")}</>
    );

    expect(container.textContent).toBe("first line\nsecond line");
    expect(container.querySelector("br")).toBeNull();
    expect(container.firstElementChild).toHaveClass("whitespace-pre-wrap");
  });
});
