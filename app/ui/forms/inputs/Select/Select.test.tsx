/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import Select from ".";

describe("Select", () => {
  it("display void options", async () => {
    render(<Select value={0} onChange={jest.fn()} options={[]} />);

    const selectElement = screen.getByTestId("form-select");
    expect(selectElement).toBeInTheDocument();

    await fireEvent.click(selectElement);
    expect(screen.queryByText("asd")).not.toBeInTheDocument();
  });

  it("display 1 option", async () => {
    render(
      <Select
        value={0}
        onChange={jest.fn()}
        options={[{ value: 0, label: "asd" }]}
      />
    );

    const selectElement = screen.getByTestId("form-select");
    expect(selectElement).toBeInTheDocument();

    await fireEvent.click(selectElement);

    const listbox = screen.getByText("asd");
    expect(listbox).toBeInTheDocument();
  });
});
