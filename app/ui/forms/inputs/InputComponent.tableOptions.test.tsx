import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";

// Captures what InputComponent hands the select, which is the behaviour
// under test; the listbox itself has its own tests.
const { selectProps } = vi.hoisted(() => ({
  selectProps: vi.fn(),
}));
vi.mock("./Select", () => ({
  default: (props: unknown) => {
    selectProps(props);
    return null;
  },
}));

import InputComponent from "./InputComponent";

const bundle = {
  faction: [{ value: 3, label: "Lantern Court" }],
  campaign: [{ value: 7, label: "Ashes" }],
};

function lastProps() {
  return selectProps.mock.calls.at(-1)![0] as {
    value: unknown;
    options: { value: unknown; label: string }[];
    multiple?: boolean;
    onChange: (value: unknown) => void;
  };
}

describe("InputComponent with a table-backed field", () => {
  beforeEach(() => vi.clearAllMocks());

  it("offers a single select a 'none' entry and maps it to null", () => {
    const setField = vi.fn();
    render(
      <InputComponent
        fieldName={NpcMetaField.faction}
        setField={setField}
        value={null as never}
        optionBundle={bundle}
      />
    );

    const props = lastProps();
    expect(props.options).toHaveLength(2);
    expect(props.options[1]).toEqual({ value: 3, label: "Lantern Court" });
    props.onChange(props.value);
    expect(setField).toHaveBeenCalledWith(NpcMetaField.faction, null);
  });

  // SPEC-022 T6: the first metadata-driven multiselect over a table.
  it("gives a multiselect no 'none' entry, and an empty list for nothing", () => {
    const setField = vi.fn();
    render(
      <InputComponent
        fieldName="revealedTo"
        setField={setField}
        value={null as never}
        optionBundle={bundle}
      />
    );

    const props = lastProps();
    expect(props.multiple).toBe(true);
    expect(props.options).toEqual([{ value: 7, label: "Ashes" }]);
    expect(props.value).toEqual([]);
    props.onChange([7]);
    expect(setField).toHaveBeenCalledWith("revealedTo", [7]);
  });
});
