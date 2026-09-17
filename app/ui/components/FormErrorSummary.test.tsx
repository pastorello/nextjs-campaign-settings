import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FormErrorSummary from "./FormErrorSummary";

describe("FormErrorSummary (TD-124)", () => {
  it("renders nothing when no field has a message", () => {
    const { container } = render(
      <FormErrorSummary errors={{ name: [], level: undefined }} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("translates each message key under common.fieldErrors, beside the field's label", () => {
    render(
      <FormErrorSummary
        errors={{
          name: [
            { key: "tooShort", values: { minimum: 3 } },
            { key: "invalid" },
          ],
          unknownField: [{ key: "factionNotFound" }],
        }}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("common.formErrors.title");
    expect(alert).toHaveTextContent(
      "common.fieldErrors.tooShort, common.fieldErrors.invalid"
    );
    // A field with no PageMeta falls back to its raw key.
    expect(alert).toHaveTextContent(
      "unknownField: common.fieldErrors.factionNotFound"
    );
  });
});
