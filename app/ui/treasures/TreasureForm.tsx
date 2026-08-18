"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createTreasure from "@/app/lib/data/treasure/createTreasure";
import updateTreasure from "@/app/lib/data/treasure/updateTreasure";
import Treasure from "@/app/lib/definitions/interfaces/treasure/Treasure";
import TreasureMetaField from "@/app/lib/definitions/enums/treasure/TreasureMetaField";
import PageType from "@/app/lib/definitions/types/PageType";

interface TreasureFormProps {
  formData?: Treasure;
  onCancel: () => void;
  onSaveFinished: (page: Treasure) => void;
}

export default function TreasureForm({
  formData,
  onCancel,
  onSaveFinished,
}: TreasureFormProps) {
  const t = useTranslations("treasure.form");

  return (
    <EntityForm<Treasure>
      pageType={PageType.Treasure}
      formData={formData}
      mutations={{ create: createTreasure, update: updateTreasure }}
      copy={{
        createTitle: t("createTitle"),
        editTitle: t("editTitle"),
        createButton: t("createButton"),
        editButton: t("editButton"),
      }}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    >
      {(field) => (
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-wrap">
            <div className="flex w-[40%] flex-col p-2">
              <div className="mb-2 flex w-full">
                {field(TreasureMetaField.name)}
              </div>
              <div className="mb-2 flex w-full gap-4">
                <div className="mb-2 flex w-[50%]">
                  {field(TreasureMetaField.category)}
                </div>
                <div className="mb-2 flex w-[50%]">
                  {field(TreasureMetaField.value)}
                </div>
              </div>
            </div>
            <div className="mb-2 flex w-[60%] p-2">
              {field(TreasureMetaField.description)}
            </div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
