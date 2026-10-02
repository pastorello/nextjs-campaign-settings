import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { encounterAdjustmentsKey } from "@/app/lib/hooks/useEncounterAdjustments";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

// A native <select> stands in for the Headless UI listbox, as in
// SceneCreatureForm.test.tsx.
vi.mock("@/app/ui/forms/inputs/Select", () => ({
  default: ({
    label,
    value,
    options = [],
    onChange,
  }: {
    label?: string;
    value: number;
    options?: { value: number; label: string }[];
    onChange: (value: string) => void;
  }) => (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

import EncounterAdjustmentsProvider from "./EncounterAdjustmentsProvider";
import PartySizeControl from "./PartySizeControl";

const page = (
  <EncounterAdjustmentsProvider
    adventureId={5}
    defaultPartySize={4}
    creatureIds={[]}
  >
    <PartySizeControl />
  </EncounterAdjustmentsProvider>
);

const select = () => screen.getByLabelText("adventure.partySize.label");

describe("PartySizeControl (SPEC-031 §5.C.8)", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts at the campaign's number of players, with no Reset", () => {
    render(page);

    expect(select()).toHaveValue("4");
    expect(
      screen.queryByText("adventure.partySize.reset")
    ).not.toBeInTheDocument();
  });

  it("changes the party size, keeps it across a reload, and resets it", () => {
    const { unmount } = render(page);
    fireEvent.change(select(), { target: { value: "3" } });
    expect(select()).toHaveValue("3");
    unmount();

    render(page);
    expect(select()).toHaveValue("3");

    fireEvent.click(screen.getByText("adventure.partySize.reset"));
    expect(select()).toHaveValue("4");
    expect(window.localStorage.getItem(encounterAdjustmentsKey(5))).toBeNull();
  });

  it("renders the stored party size on the server, before the browser's override", () => {
    window.localStorage.setItem(
      encounterAdjustmentsKey(5),
      JSON.stringify({ partySize: 2, creatures: {} })
    );

    const html = renderToString(page);

    expect(html).toMatch(/<option value="4" selected="">/);
  });

  it("renders nothing outside the provider", () => {
    const { container } = render(<PartySizeControl />);
    expect(container).toBeEmptyDOMElement();
  });
});
