"use client";

import { Fieldset } from "@headlessui/react";

import EntityForm from "@/app/ui/forms/EntityForm";
import createNpc from "@/app/lib/data/npc/createNpc";
import updateNpc from "@/app/lib/data/npc/updateNpc";
import PageType from "@/app/lib/definitions/types/PageType";
import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";

// All user-facing copy for this form, in one place for TD-21.
const COPY = {
  createTitle: "Crea nuovo PNG",
  editTitle: "Modifica PNG",
  createButton: "Crea PNG",
  editButton: "Modifica PNG",
};

interface NpcFormProps {
  formData?: NpcItem;
  onCancel: () => void;
  onSaveFinished: (page: NpcItem) => void;
}

export default function NpcForm({
  formData,
  onCancel,
  onSaveFinished,
}: NpcFormProps) {
  return (
    <EntityForm<NpcItem>
      pageType={PageType.Npc}
      formData={formData}
      mutations={{ create: createNpc, update: updateNpc }}
      copy={COPY}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    >
      {(field) => (
        <Fieldset className="flex w-full flex-col">
          <div className="flex w-full gap-2">
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">{field(NpcMetaField.name)}</div>
            </div>
            <div className="mb-2 w-[15%]">
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.alignment)}
              </div>
            </div>
            <div className="mb-2 w-[25%]">
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.faction)}
              </div>
            </div>
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.location)}
              </div>
            </div>
          </div>
          <div className="flex w-full gap-2">
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.title)}
              </div>
            </div>
            <div className="mb-2 w-[15%]">
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.alignmentDomain)}
              </div>
            </div>
            <div className="mb-2 w-[55%]">
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.position)}
              </div>
            </div>
          </div>
          <div className="mb-2 flex w-full flex-col p-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.appearance)}
              </div>
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.motivations)}
              </div>
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.personality)}
              </div>
              <div className="mb-2 flex w-full">
                {field(NpcMetaField.secrets)}
              </div>
            </div>
            <div className="mb-2 flex w-full">
              {field(NpcMetaField.description)}
            </div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
