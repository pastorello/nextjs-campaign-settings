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
});
