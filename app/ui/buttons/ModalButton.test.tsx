import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Modal and the six form variants it can render each have their own
// suites. ModalButton's own job is the open/close state and picking the
// right variant by `modalContent` — stubbed here to isolate exactly that.
vi.mock("../components/Modal", () => ({
  default: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div>
        modal:{title}
        {children}
      </div>
    ) : null,
}));

vi.mock("../magicitems/MagicItemForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-magicitem</button>
  ),
}));
vi.mock("../npc/NpcForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-npc</button>
  ),
}));
vi.mock("../spells/SpellForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-spell</button>
  ),
}));
vi.mock("../deities/DeityForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-deity</button>
  ),
}));
vi.mock("../forms/PageForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: () => void }) => (
    <button onClick={() => onSaveFinished()}>save-delete</button>
  ),
}));
vi.mock("../factions/FactionForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-faction</button>
  ),
}));

import ModalButton from "./ModalButton";

describe("ModalButton", () => {
  it("does not render the modal before the button is clicked", () => {
    render(
      <ModalButton
        buttonLabel="Edit"
        modalTitle="Edit item"
        modalContent="spellform"
      />
    );

    expect(screen.queryByText(/modal:/)).not.toBeInTheDocument();
  });

  it("opens the modal, rendering the variant matching modalContent", () => {
    render(
      <ModalButton
        buttonLabel="Edit"
        modalTitle="Edit spell"
        modalContent="spellform"
      />
    );

    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByText(/modal:Edit spell/)).toBeInTheDocument();
    expect(screen.getByText("save-spell")).toBeInTheDocument();
  });

  it.each([
    ["magicitemform", "save-magicitem"],
    ["npcform", "save-npc"],
    ["deityform", "save-deity"],
    ["deleteform", "save-delete"],
    ["factionform", "save-faction"],
  ])("renders the %s variant", (modalContent, expectedText) => {
    render(
      <ModalButton
        buttonLabel="Edit"
        modalTitle="Edit item"
        modalContent={modalContent}
      />
    );

    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it("closes the modal and forwards the saved item to onSave", () => {
    const onSave = vi.fn();
    render(
      <ModalButton
        buttonLabel="Edit"
        modalTitle="Edit spell"
        modalContent="spellform"
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("save-spell"));

    expect(onSave).toHaveBeenCalledWith({ id: 1 });
    expect(screen.queryByText(/modal:/)).not.toBeInTheDocument();
  });
});
