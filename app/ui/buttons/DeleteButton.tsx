"use client";

import { useRouter } from "next/navigation";
import PageType from "@/app/lib/definitions/types/PageType";
import ButtonVariant from "../buttons/BaseButton/ButtonVariant";
import ModalButton from "./ModalButton";

// All user-facing copy for this component, in one place for TD-21.
const COPY = {
  deleteFailed: "Errore durante la cancellazione",
  networkFailed: "Errore di rete",
};

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
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (data.success === true) {
        router.refresh();
        return;
      }

      // The handler now says which of the two it was — a missing record or a
      // failed query (TD-13). Showing its message beats a fixed string that
      // could mean either. Still an alert: routing this through a toast is
      // TD-10's, and it is the notification system that does not exist yet.
      alert(data.error ?? COPY.deleteFailed);
    } catch {
      alert(COPY.networkFailed);
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
