import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import renderRichText from "./renderRichText";

describe("renderRichText", () => {
  it("renders the given HTML", () => {
    const { container } = render(<>{renderRichText("<p>Hello</p>")}</>);

    expect(container.innerHTML).toBe("<div><p>Hello</p></div>");
  });
});
