"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhCommunity from "@/app/lib/data/dhCommunities/createDhCommunity";
import updateDhCommunity from "@/app/lib/data/dhCommunities/updateDhCommunity";
import DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";
import DhCommunityMetaField from "@/app/lib/definitions/enums/daggerheart/DhCommunityMetaField";
import PageType from "@/app/lib/definitions/types/PageType";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

interface DhCommunityFormProps {
  formData?: DhCommunity;
  onCancel: () => void;
  onSaveFinished: (page: DhCommunity) => void;
  /** The places and factions it may link to (`zone`, `faction`). */
  optionBundle?: OptionBundle | undefined;
}

/**
 * A Daggerheart community's form (SPEC-027 T3): its feature, and the places
 * and factions of the shared world it belongs to.
 */
export default function DhCommunityForm({
  formData,
  onCancel,
  onSaveFinished,
  optionBundle,
}: DhCommunityFormProps) {
  const t = useTranslations("dhCommunities.form");

  return (
    <EntityForm<DhCommunity>
      pageType={PageType.DhCommunity}
      formData={formData}
      mutations={{ create: createDhCommunity, update: updateDhCommunity }}
      copy={{
        createTitle: t("createTitle"),
        editTitle: t("editTitle"),
        createButton: t("createButton"),
        editButton: t("editButton"),
      }}
      optionBundle={optionBundle}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    >
      {(field) => (
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-col p-2 md:w-[40%]">
            <div className="mb-2 flex w-full">
              {field(DhCommunityMetaField.name)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhCommunityMetaField.adjectives)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhCommunityMetaField.origin)}
            </div>
          </div>
          <div className="mb-2 flex w-full p-2 md:w-[60%]">
            {field(DhCommunityMetaField.description)}
          </div>
          <div className="flex w-full flex-col p-2">
            <div className="mb-2 flex w-full">
              {field(DhCommunityMetaField.featureName)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhCommunityMetaField.featureText)}
            </div>
          </div>
          <div className="mb-2 flex w-full p-2 md:w-1/2">
            {field(DhCommunityMetaField.placeIds)}
          </div>
          <div className="mb-2 flex w-full p-2 md:w-1/2">
            {field(DhCommunityMetaField.factionIds)}
          </div>
          <div className="mb-2 flex w-full p-2">
            {field(DhCommunityMetaField.imageId)}
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
