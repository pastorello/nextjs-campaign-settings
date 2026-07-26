"use client";

import { Fieldset } from "@headlessui/react";

import EntityForm from "@/app/ui/forms/EntityForm";
import createSpell from "@/app/lib/data/spells/createSpell";
import updateSpell from "@/app/lib/data/spells/updateSpell";
import PageType from "@/app/lib/definitions/types/PageType";
import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

// All user-facing copy for this form, in one place for TD-21.
const COPY = {
  createTitle: "Crea nuovo Incantesimo",
  editTitle: "Modifica Incantesimo",
  createButton: "Crea Incantesimo",
  editButton: "Modifica Incantesimo",
};

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
  return (
    <EntityForm<Spell>
      pageType={PageType.Spell}
      formData={formData}
      mutations={{ create: createSpell, update: updateSpell }}
      copy={COPY}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    >
      {(field) => (
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[30%]">
              {field(SpellMetaField.nome)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(SpellMetaField.livello)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(SpellMetaField.classi)}
            </div>
            <div className="box-border w-full p-2 lg:w-[40%]">
              {field(SpellMetaField.circolo)}
            </div>
          </div>

          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[20%]">
              {field(SpellMetaField.tempoDiLancio)}
            </div>
            <div className="box-border w-full p-2 lg:w-[20%]">
              {field(SpellMetaField.gittata)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(SpellMetaField.componenti)}
            </div>
            <div className="box-border w-full p-2 lg:w-[25%]">
              {field(SpellMetaField.durata)}
            </div>
            <div className="box-border w-full p-2 pt-7 lg:w-[20%]">
              {field(SpellMetaField.rituale)}
            </div>
          </div>

          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[50%]">
              {field(SpellMetaField.descrizione)}
            </div>
            <div className="box-border w-full p-2 lg:w-[50%]">
              {field(SpellMetaField.intensificato)}
            </div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
