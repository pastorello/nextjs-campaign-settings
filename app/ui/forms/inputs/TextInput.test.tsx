import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TextInput from "./TextInput";
import IconType from "../../buttons/BaseButton/IconType";

describe("TextInput", () => {
  it("renders the current value", () => {
    render(<TextInput value="Fireball" onChange={vi.fn()} />);

    expect(screen.getByRole("textbox")).toHaveValue("Fireball");
  });

  it("calls onChange with the new value on input", () => {
    const onChange = vi.fn();
    render(<TextInput value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Magic Missile" },
    });

    expect(onChange).toHaveBeenCalledWith("Magic Missile");
  });

  it("renders a label only when one is given", () => {
    const { rerender } = render(<TextInput value="" onChange={vi.fn()} />);
    expect(screen.queryByText("Nome")).not.toBeInTheDocument();

    rerender(<TextInput value="" onChange={vi.fn()} label="Nome" />);
    expect(screen.getByText("Nome")).toBeInTheDocument();
  });

  it("applies the given placeholder", () => {
    render(<TextInput value="" onChange={vi.fn()} placeholder="Cerca..." />);

    expect(screen.getByPlaceholderText("Cerca...")).toBeInTheDocument();
  });

  it("renders an icon only when one is given", () => {
    const { container, rerender } = render(
      <TextInput value="" onChange={vi.fn()} />
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();

    rerender(<TextInput value="" onChange={vi.fn()} icon={IconType.search} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("is a plain text field unless told otherwise", () => {
    render(<TextInput value="" onChange={() => {}} label="Name" />);

    expect(screen.getByLabelText("Name")).toHaveAttribute("type", "text");
  });

  // SPEC-022: the account forms' password fields.
  it("takes a type and an autofill hint", () => {
    render(
      <TextInput
        value=""
        onChange={() => {}}
        label="Password"
        inputType="password"
        autoComplete="new-password"
      />
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "new-password");
  });
});
