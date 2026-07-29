"use client";

import { useState } from "react";

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

interface ModalButtonProps {
  onSave?: (item: object) => void;
  buttonLabel: string;
  modalTitle: string;
  modalContent: string;
  buttonVariant?: ButtonVariant;
  modalDescription?: string;
  modalSize?: string;
  componentProps?: ListItem;
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
}: ModalButtonProps) => {
  const [isOpen, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  return (
    <>
      <BaseButton
        onClick={openModal}
        size={ButtonSize.small}
        variant={buttonVariant}
      >
        {buttonLabel}
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
              onSaveFinished={(item: object) => {
                closeModal();
                if (onSave) {
                  onSave(item);
                }
              }}
            />
          )}
          {modalContent === "npcform" && (
            <NpcForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={(item: object) => {
                closeModal();
                if (onSave) {
                  onSave(item);
                }
              }}
            />
          )}
          {modalContent === "spellform" && (
            <SpellForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={(item: object) => {
                closeModal();
                if (onSave) {
                  onSave(item);
                }
              }}
            />
          )}
          {modalContent === "deityform" && (
            <DeityForm
              {...componentProps}
              onCancel={closeModal}
              onSaveFinished={(item: object) => {
                closeModal();
                if (onSave) {
                  onSave(item);
                }
              }}
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
