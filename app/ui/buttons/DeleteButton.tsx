"use client";

import { useRouter } from "next/navigation";
import PageType from "@/app/lib/definitions/types/PageType";
import ButtonVariant from "../buttons/BaseButton/ButtonVariant";
import ModalButton from "./ModalButton";

interface DeleteButtonProps {
  pageName: string;
  pageId: number;
  pageType: PageType;
}

const DeleteButton = ({ pageName, pageId, pageType }: DeleteButtonProps) => {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/${pageType}/${pageId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success === true) {
        router.refresh();
      } else {
        alert("Errore durante la cancellazione");
      }
    } catch (error) {
      alert("Errore di rete");
    }
  };

  return (
    <ModalButton
      onSave={handleDelete}
      buttonLabel={"Delete"}
      modalTitle={`Permanently delete page "${pageName}?"`}
      modalDescription={"This operation can't be undone"}
      modalContent={"deleteform"}
      modalSize="small"
      buttonVariant={ButtonVariant.danger}
    />
  );
};

export default DeleteButton;
