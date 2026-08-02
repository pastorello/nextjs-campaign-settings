import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TextareaInput from "./TextareaInput";

describe("TextareaInput", () => {
  it("renders the current value", () => {
    render(
      <TextareaInput
        value="A tale of two cities"
        onChange={vi.fn()}
        label="Descrizione"
      />
    );

    expect(screen.getByRole("textbox")).toHaveValue("A tale of two cities");
  });

  it("calls onChange with the new value on input", () => {
    const onChange = vi.fn();
    render(<TextareaInput value="" onChange={onChange} label="Descrizione" />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "New text" },
    });

    expect(onChange).toHaveBeenCalledWith("New text");
  });

  it("renders the given label", () => {
    render(<TextareaInput value="" onChange={vi.fn()} label="Descrizione" />);

    expect(screen.getByText("Descrizione")).toBeInTheDocument();
  });

  it("applies the given placeholder", () => {
    render(
      <TextareaInput
        value=""
        onChange={vi.fn()}
        label="Descrizione"
        placeholder="Scrivi qui..."
      />
    );

    expect(screen.getByPlaceholderText("Scrivi qui...")).toBeInTheDocument();
  });
});
