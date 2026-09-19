import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InputComponent from "./InputComponent";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

describe("InputComponent", () => {
  it("renders a text control for a string field", () => {
    const setField = vi.fn();
    render(
      <InputComponent fieldName="name" setField={setField} value="Fireball" />
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Fireball");

    fireEvent.change(input, { target: { value: "Ice Storm" } });
    expect(setField).toHaveBeenCalledWith("name", "Ice Storm");
  });

  it("renders the formatted-text editor for a description (SPEC-019 T5)", async () => {
    const setField = vi.fn();
    render(
      <InputComponent
        fieldName="description"
        setField={setField}
        value="A ball of fire"
      />
    );

    const editor = await screen.findByRole("textbox");
    expect(editor).toHaveAttribute("contenteditable", "true");
    expect(editor).toHaveTextContent("A ball of fire");
  });

  it("grows the editor for a field declared tall in its meta (TD-120)", () => {
    const setField = vi.fn();
    render(
      <InputComponent fieldName="description" setField={setField} value="" />
    );

    expect(screen.getByRole("textbox")).toHaveClass("h-[280px]");
  });

  it("renders a checkbox control for a boolean field", () => {
    const setField = vi.fn();
    render(
      <InputComponent
        fieldName={SpellMetaField.ritual}
        setField={setField}
        value={false}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(setField).toHaveBeenCalledWith(SpellMetaField.ritual, true);
  });

  it("renders a multiselect control with its declared options", () => {
    const setField = vi.fn();
    render(
      <InputComponent
        fieldName={SpellMetaField.circle}
        setField={setField}
        value={[]}
      />
    );

    expect(screen.getByTestId("form-select")).toBeInTheDocument();
  });

  it("throws for an unsupported field name", () => {
    const setField = vi.fn();
    expect(() =>
      render(
        <InputComponent
          // @ts-expect-error deliberately invalid for this test
          fieldName="not-a-real-field"
          setField={setField}
          value=""
        />
      )
    ).toThrow();
  });
});
