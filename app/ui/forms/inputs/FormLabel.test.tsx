import { render, screen } from "@testing-library/react";
import { Field } from "@headlessui/react";
import { describe, expect, it } from "vitest";

import FormLabel from "./FormLabel";

// `Label` reads its context from the nearest headlessui `Field`, so it errors
// if rendered outside one — matching how every input control uses it.
describe("FormLabel", () => {
  it("renders the given label text", () => {
    render(
      <Field>
        <FormLabel label="Nome" />
      </Field>
    );

    expect(screen.getByText("Nome")).toBeInTheDocument();
  });

  it("renders normal-case, readable text, not tiny all-caps (TD-120)", () => {
    render(
      <Field>
        <FormLabel label="Nome" />
      </Field>
    );

    const label = screen.getByText("Nome");
    expect(label).not.toHaveClass("uppercase");
    expect(label).not.toHaveClass("font-bold");
  });
});
