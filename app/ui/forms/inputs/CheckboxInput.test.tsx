import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CheckboxInput from "./CheckboxInput";

describe("CheckboxInput", () => {
  it("renders unchecked when value is not true", () => {
    render(<CheckboxInput label="Rituale" value={false} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("renders checked when value is true", () => {
    render(<CheckboxInput label="Rituale" value={true} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("treats any non-true value as unchecked", () => {
    render(<CheckboxInput label="Rituale" value="" onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("calls onChange when clicked", () => {
    const onChange = vi.fn();
    render(<CheckboxInput label="Rituale" value={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders the given label", () => {
    render(<CheckboxInput label="Rituale" value={false} onChange={vi.fn()} />);

    expect(screen.getByText("Rituale")).toBeInTheDocument();
  });
});
