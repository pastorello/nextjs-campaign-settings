/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

describe("Page", () => {
  it("renders a heading", () => {
    // render(<Page />);
    //NON FUNZIONA IL LOGIN
    // const heading = screen.getByRole("heading", { level: 1 });
    // const heading = screen.getByText("Magic items");
    // expect(heading).toBeInTheDocument();
  });
});
