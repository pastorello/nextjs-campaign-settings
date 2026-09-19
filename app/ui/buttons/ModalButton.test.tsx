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
vi.mock("../treasures/TreasureForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-treasure</button>
  ),
}));
vi.mock("../dhDomains/DhDomainForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-dhdomain</button>
  ),
}));
vi.mock("../dhDomainCards/DhDomainCardForm", () => ({
  default: ({
    onSaveFinished,
    optionBundle,
  }: {
    onSaveFinished: (i: object) => void;
    optionBundle?: { dhDomain?: { label: string }[] };
  }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>
      save-dhdomaincard:{optionBundle?.dhDomain?.[0]?.label}
    </button>
  ),
}));
vi.mock("../dhClasses/DhClassForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-dh-class</button>
  ),
}));
vi.mock("../dhSubclasses/DhSubclassForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: (i: object) => void }) => (
    <button onClick={() => onSaveFinished({ id: 1 })}>save-dh-subclass</button>
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
    ["treasureform", "save-treasure"],
    ["dhdomainform", "save-dhdomain"],
    ["dhdomaincardform", "save-dhdomaincard:"],
    ["dhclassform", "save-dh-class"],
    ["dhsubclassform", "save-dh-subclass"],
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

  it.each([
    ["spellform", "save-spell", { id: 1 }],
    ["dhclassform", "save-dh-class", { id: 1 }],
    ["deleteform", "save-delete", {}],
  ])(
    "closes the %s modal on save and hands on what was saved",
    (modalContent, saveText, saved) => {
      const onSave = vi.fn();
      render(
        <ModalButton
          buttonLabel="Edit"
          modalTitle="Edit item"
          modalContent={modalContent}
          onSave={onSave}
        />
      );

      fireEvent.click(screen.getByText("Edit"));
      fireEvent.click(screen.getByText(saveText, { exact: false }));

      expect(onSave).toHaveBeenCalledWith(saved);
      expect(screen.queryByText(/modal:/)).not.toBeInTheDocument();
    }
  );

  it("hands the domain card form its domain options (SPEC-021 T3)", () => {
    render(
      <ModalButton
        buttonLabel="Edit"
        modalTitle="Edit card"
        modalContent="dhdomaincardform"
        optionBundle={{ dhDomain: [{ value: 1, label: "Veilwright" }] }}
      />
    );

    fireEvent.click(screen.getByText("Edit"));

    expect(
      screen.getByText("save-dhdomaincard:Veilwright")
    ).toBeInTheDocument();
  });

  // TD-136: an admin row's edit/delete buttons all read "Modifica"/"Elimina"
  // with no item name, so a screen reader's button list names every row the
  // same. ariaLabel lets a caller give each trigger a distinct name.
  it("uses ariaLabel as the trigger's accessible name when given", () => {
    render(
      <ModalButton
        buttonLabel="Edit"
        ariaLabel="Edit Fireball"
        modalTitle="Edit spell"
        modalContent="spellform"
      />
    );

    expect(
      screen.getByRole("button", { name: "Edit Fireball" })
    ).toBeInTheDocument();
  });

  // TD-118: the admin list's row actions became icon buttons — the icon
  // replaces the visible label, but the accessible name (ariaLabel) still
  // has to carry the item name, since an icon alone names nothing.
  it("renders the icon instead of buttonLabel's text when icon is given", () => {
    render(
      <ModalButton
        buttonLabel="Edit"
        ariaLabel="Edit Fireball"
        modalTitle="Edit spell"
        modalContent="spellform"
        icon={<span data-testid="edit-icon" />}
      />
    );

    expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Fireball" })
    ).toBeInTheDocument();
  });

  it("falls back to no aria-label when none is given", () => {
    render(
      <ModalButton
        buttonLabel="Edit"
        modalTitle="Edit spell"
        modalContent="spellform"
      />
    );

    expect(screen.getByRole("button")).not.toHaveAttribute("aria-label");
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
