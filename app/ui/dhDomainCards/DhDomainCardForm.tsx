"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhDomainCard from "@/app/lib/data/dhDomainCards/createDhDomainCard";
import updateDhDomainCard from "@/app/lib/data/dhDomainCards/updateDhDomainCard";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import DhDomainCardMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainCardMetaField";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import PageType from "@/app/lib/definitions/types/PageType";

interface DhDomainCardFormProps {
  formData?: DhDomainCard;
  onCancel: () => void;
  onSaveFinished: (page: DhDomainCard) => void;
  /** Resolves the domain select — absent renders it empty. */
  optionBundle?: OptionBundle | undefined;
}

/** A Daggerheart domain card's form (SPEC-021 T3). */
export default function DhDomainCardForm({
  formData,
  onCancel,
  onSaveFinished,
  optionBundle,
}: DhDomainCardFormProps) {
  const t = useTranslations("dhDomainCards.form");

  return (
    <EntityForm<DhDomainCard>
      pageType={PageType.DhDomainCard}
      formData={formData}
      mutations={{ create: createDhDomainCard, update: updateDhDomainCard }}
      copy={{
        createTitle: t("createTitle"),
        editTitle: t("editTitle"),
        createButton: t("createButton"),
        editButton: t("editButton"),
      }}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
      optionBundle={optionBundle}
    >
      {(field) => (
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-col p-2 md:w-[40%]">
            <div className="mb-2 flex w-full">
              {field(DhDomainCardMetaField.name)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhDomainCardMetaField.domainId)}
            </div>
            <div className="mb-2 flex w-full gap-4">
              <div className="flex w-1/2">
                {field(DhDomainCardMetaField.cardLevel)}
              </div>
              <div className="flex w-1/2">
                {field(DhDomainCardMetaField.recallCost)}
              </div>
            </div>
            <div className="mb-2 flex w-full gap-4">
              <div className="flex w-1/2">
                {field(DhDomainCardMetaField.cardType)}
              </div>
              <div className="flex w-1/2">
                {field(DhDomainCardMetaField.origin)}
              </div>
            </div>
          </div>
          <div className="mb-2 flex w-full p-2 md:w-[60%]">
            {field(DhDomainCardMetaField.featureText)}
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
