"use client";

import { ReactNode, useState } from "react";

import BaseButton from "./BaseButton";
import Modal from "../components/Modal";
import ButtonSize from "./BaseButton/ButtonSize";
import ButtonVariant from "./BaseButton/ButtonVariant";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import MagicItemForm from "../magicitems/MagicItemForm";
import PageForm from "../forms/PageForm";
import NpcForm from "../npc/NpcForm";
import SpellForm from "../spells/SpellForm";
import DeityForm from "../deities/DeityForm";
import FactionForm from "../factions/FactionForm";
import TreasureForm from "../treasures/TreasureForm";
import DhDomainForm from "../dhDomains/DhDomainForm";
import DhDomainCardForm from "../dhDomainCards/DhDomainCardForm";
import DhClassForm from "../dhClasses/DhClassForm";
import DhSubclassForm from "../dhSubclasses/DhSubclassForm";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

interface ModalButtonProps {
  onSave?: (item: object) => void;
  buttonLabel: string;
  modalTitle: string;
  modalContent: string;
  buttonVariant?: ButtonVariant;
  modalDescription?: string;
  modalSize?: string;
  componentProps?: ListItem;
  /**
   * Read by the forms with a table-backed field: NPCs, domain cards,
   * classes and subclasses.
   */
  optionBundle?: OptionBundle | undefined;
  /**
   * Accessible name for the trigger button, for callers whose `buttonLabel`
   * reads identically on every row (e.g. an admin list's "Modifica"/"Edit")
   * — without it, a screen reader's button list names every row the same
   * (TD-136). Falls back to `buttonLabel` when omitted.
   */
  ariaLabel?: string | undefined;

  /**
   * Renders instead of `buttonLabel`'s text when given, for a row action
   * that reads as an icon rather than a label (TD-118). `ariaLabel` still
   * carries the accessible name — an icon alone names nothing.
   */
  icon?: ReactNode | undefined;
}

const ModalButton = ({
  onSave,
  buttonLabel,
  modalTitle,
  modalContent,
  buttonVariant = ButtonVariant.primary,
  modalDescription = "",
  modalSize = "medium",
  componentProps,
  optionBundle,
  ariaLabel,
  icon,
}: ModalButtonProps) => {
  const [isOpen, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);
  // Every domain form reports the record it saved; the modal closes, then
  // hands it on.
  const saveFinished = (item: object) => {
    closeModal();
    onSave?.(item);
  };

  return (
    <>
      <BaseButton
        onClick={openModal}
        size={ButtonSize.small}
        variant={buttonVariant}
        ariaLabel={ariaLabel}
      >
        {icon ?? buttonLabel}
      </BaseButton>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          setIsOpen={setOpen}
          title={modalTitle}
          description={modalDescription}
          size={modalSize}
        >
          {modalContent === "magicitemform" && (
            <MagicItemForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "npcform" && (
            <NpcForm
              {...componentProps}
              optionBundle={optionBundle}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "spellform" && (
            <SpellForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "deityform" && (
            <DeityForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "factionform" && (
            <FactionForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "treasureform" && (
            <TreasureForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "dhdomainform" && (
            <DhDomainForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "dhdomaincardform" && (
            <DhDomainCardForm
              {...componentProps}
              optionBundle={optionBundle}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "dhclassform" && (
            <DhClassForm
              {...componentProps}
              optionBundle={optionBundle}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "dhsubclassform" && (
            <DhSubclassForm
              {...componentProps}
              optionBundle={optionBundle}
              onCancel={closeModal}
              onSaveFinished={saveFinished}
            />
          )}
          {modalContent === "deleteform" && (
            <PageForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={() => {
                // Unlike the domain forms above, PageForm's delete
                // confirmation has no saved record to report — it calls this
                // with no arguments.
                closeModal();
                if (onSave) {
                  onSave({});
                }
              }}
            />
          )}
        </Modal>
      )}
    </>
  );
};

export default ModalButton;
