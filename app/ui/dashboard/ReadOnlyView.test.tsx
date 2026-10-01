import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReadOnlyViewProvider, useReadOnlyView } from "./ReadOnlyView";

function Probe() {
  return <p>{String(useReadOnlyView())}</p>;
}

describe("ReadOnlyView (SPEC-022 T8b)", () => {
  it("is editable outside a provider, as for the DM", () => {
    render(<Probe />);

    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("is read only under a player's provider", () => {
    render(
      <ReadOnlyViewProvider readOnly>
        <Probe />
      </ReadOnlyViewProvider>
    );

    expect(screen.getByText("true")).toBeInTheDocument();
  });
});
