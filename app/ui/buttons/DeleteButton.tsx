"use client";

import { useRouter } from "next/navigation";

import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
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
        notifySuccess(`${pageName} eliminato`);
        router.refresh();
        return;
      }

      // The handler says which of the two it was — a missing record or a
      // failed query (TD-13) — and TD-10 finally gives it somewhere to appear
      // that is not a browser alert().
      notifyError(data.error ?? COPY.deleteFailed);
    } catch {
      notifyError(COPY.networkFailed);
    }
  };

  return (
    <ModalButton
      onSave={() => void handleDelete()}
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
