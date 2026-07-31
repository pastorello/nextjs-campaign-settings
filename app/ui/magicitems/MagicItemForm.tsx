"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createMagicItem from "@/app/lib/data/magicitems/createMagicItem";
import updateMagicItem from "@/app/lib/data/magicitems/updateMagicItem";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import PageType from "@/app/lib/definitions/types/PageType";

interface MagicItemFormProps {
  formData?: MagicItem;
  onCancel: () => void;
  onSaveFinished: (page: MagicItem) => void;
}

export default function MagicItemForm({
  formData,
  onCancel,
  onSaveFinished,
}: MagicItemFormProps) {
  const t = useTranslations("magicItems.form");

  return (
    <EntityForm<MagicItem>
      pageType={PageType.MagicItem}
      formData={formData}
      mutations={{ create: createMagicItem, update: updateMagicItem }}
      copy={{
        createTitle: t("createTitle"),
        editTitle: t("editTitle"),
        createButton: t("createButton"),
        editButton: t("editButton"),
      }}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
      // Alone among the four forms, this one has always allowed submitting an
      // untouched form. Preserved rather than quietly aligned — see
      // EntityForm's prop.
      disableUntilEdited={false}
    >
      {(field) => (
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-wrap">
            <div className="flex w-[40%] flex-col p-2">
              <div className="mb-2 flex w-full">
                {field(MagicItemMetaField.name)}
              </div>
              <div className="mb-2 flex w-full gap-4">
                <div className="mb-2 flex w-[50%]">
                  {field(MagicItemMetaField.type)}
                </div>
                <div className="mb-2 flex w-[50%]">
                  {field(MagicItemMetaField.rarity)}
                </div>
              </div>
              <div className="mb-2 flex w-full">
                {field(MagicItemMetaField.attuned)}
              </div>
            </div>
            <div className="mb-2 flex w-[60%] p-2">
              {field(MagicItemMetaField.description)}
            </div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
