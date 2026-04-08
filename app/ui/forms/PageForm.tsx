import { ReactNode } from "react";
import clsx from "clsx";

import ButtonVariant from "../buttons/BaseButton/ButtonVariant";

import BaseButton from "../buttons/BaseButton";
import Spinner from "../components/Spinner";

interface PageFormProps {
  lastError?: { message: string };
  onCancel: Function;
  onSaveFinished: Function;
  hasEdits?: boolean;
  isSaving?: boolean;
  children?: ReactNode;
}
const PageForm = ({
  lastError,
  onCancel,
  onSaveFinished,
  hasEdits,
  isSaving,
  children,
}: PageFormProps) => {
  const isDeletingMode = !children;

  const saveButtonLabels = isDeletingMode
    ? { doIt: "Delete", doingIt: "Deleting" }
    : { doIt: "Save", doingIt: "Saving" };

  return (
    <div
      className={clsx({
        "w-[400px]": isDeletingMode,
        "w-[900px]": !isDeletingMode,
      })}
    >
      {!isDeletingMode && children}
      {lastError ? (
        <div className="text-red-600" style={{ marginBottom: "20px" }}>
          Error: {lastError.message}
        </div>
      ) : (
        false
      )}
      <div className="flex justify-end gap-2">
        <BaseButton
          onClick={onSaveFinished}
          disabled={!(hasEdits || isDeletingMode) || isSaving}
          variant={
            isDeletingMode ? ButtonVariant.danger : ButtonVariant.primary
          }
        >
          {isSaving ? (
            <>
              <Spinner />
              {saveButtonLabels.doingIt}
            </>
          ) : (
            saveButtonLabels.doIt
          )}
        </BaseButton>
        <BaseButton
          onClick={onCancel}
          variant={ButtonVariant.secondary}
          disabled={isSaving}
        >
          {"Annulla"}
        </BaseButton>
      </div>
    </div>
  );
};

export default PageForm;
