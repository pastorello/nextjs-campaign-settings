"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createSpell from "@/app/lib/data/spells/createSpell";
import updateSpell from "@/app/lib/data/spells/updateSpell";
import PageType from "@/app/lib/definitions/types/PageType";
import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

interface SpellFormProps {
  formData?: Spell;
  onCancel: () => void;
  onSaveFinished: (page: Spell) => void;
}

export default function SpellForm({
  formData,
  onCancel,
  onSaveFinished,
}: SpellFormProps) {
  const t = useTranslations("spells.form");

  return (
    <EntityForm<Spell>
      pageType={PageType.Spell}
      formData={formData}
      mutations={{ create: createSpell, update: updateSpell }}
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
            <div className="box-border w-full p-2 lg:w-[30%]">
              {field(SpellMetaField.name)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(SpellMetaField.level)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(SpellMetaField.classes)}
            </div>
            <div className="box-border w-full p-2 lg:w-[40%]">
              {field(SpellMetaField.circle)}
            </div>
          </div>

          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[20%]">
              {field(SpellMetaField.castingTime)}
            </div>
            <div className="box-border w-full p-2 lg:w-[20%]">
              {field(SpellMetaField.range)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(SpellMetaField.components)}
            </div>
            <div className="box-border w-full p-2 lg:w-[25%]">
              {field(SpellMetaField.duration)}
            </div>
            <div className="box-border w-full p-2 pt-7 lg:w-[20%]">
              {field(SpellMetaField.ritual)}
            </div>
          </div>

          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[50%]">
              {field(SpellMetaField.description)}
            </div>
            <div className="box-border w-full p-2 lg:w-[50%]">
              {field(SpellMetaField.upcast)}
            </div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
