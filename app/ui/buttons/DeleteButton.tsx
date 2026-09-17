"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TrashIcon } from "@heroicons/react/24/outline";

import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import PageType from "@/app/lib/definitions/types/PageType";
import ButtonVariant from "../buttons/BaseButton/ButtonVariant";
import ModalButton from "./ModalButton";

interface DeleteButtonProps {
  pageName: string;
  pageId: number;
  pageType: PageType;
}

const DeleteButton = ({ pageName, pageId, pageType }: DeleteButtonProps) => {
  const t = useTranslations("common");
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
        notifySuccess(t("deleteButton.deleted", { name: pageName }));
        router.refresh();
        return;
      }

      // The handler says which of the two it was — a missing record or a
      // failed query (TD-13) — and TD-10 finally gives it somewhere to appear
      // that is not a browser alert().
      notifyError(data.error ?? t("deleteButton.deleteFailed"));
    } catch {
      notifyError(t("deleteButton.networkFailed"));
    }
  };

  return (
    <ModalButton
      onSave={() => void handleDelete()}
      buttonLabel={t("form.delete")}
      ariaLabel={t("table.deleteItem", { name: pageName })}
      modalTitle={t("deleteButton.confirmTitle", { name: pageName })}
      modalDescription={t("deleteButton.confirmDescription")}
      modalContent={"deleteform"}
      modalSize="small"
      buttonVariant={ButtonVariant.ghostDanger}
      icon={<TrashIcon className="h-4 w-4" aria-hidden="true" />}
    />
  );
};

export default DeleteButton;
