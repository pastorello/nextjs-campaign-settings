"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createFaction from "@/app/lib/data/faction/createFaction";
import updateFaction from "@/app/lib/data/faction/updateFaction";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import PageType from "@/app/lib/definitions/types/PageType";

interface FactionFormProps {
  formData?: Faction;
  onCancel: () => void;
  onSaveFinished: (page: Faction) => void;
}

export default function FactionForm({
  formData,
  onCancel,
  onSaveFinished,
}: FactionFormProps) {
  const t = useTranslations("factions.form");

  return (
    <EntityForm<Faction>
      pageType={PageType.Faction}
      formData={formData}
      mutations={{ create: createFaction, update: updateFaction }}
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
          <div className="mb-2 flex w-full p-2">{field("name")}</div>
          <div className="mb-2 flex w-full p-2">{field("description")}</div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
