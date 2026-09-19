"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhDomain from "@/app/lib/data/dhDomains/createDhDomain";
import updateDhDomain from "@/app/lib/data/dhDomains/updateDhDomain";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import DhDomainMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainMetaField";
import PageType from "@/app/lib/definitions/types/PageType";

interface DhDomainFormProps {
  formData?: DhDomain;
  onCancel: () => void;
  onSaveFinished: (page: DhDomain) => void;
}

/** A Daggerheart domain's form (SPEC-021 T2). */
export default function DhDomainForm({
  formData,
  onCancel,
  onSaveFinished,
}: DhDomainFormProps) {
  const t = useTranslations("dhDomains.form");

  return (
    <EntityForm<DhDomain>
      pageType={PageType.DhDomain}
      formData={formData}
      mutations={{ create: createDhDomain, update: updateDhDomain }}
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
          <div className="flex w-full flex-col p-2 md:w-[40%]">
            <div className="mb-2 flex w-full">
              {field(DhDomainMetaField.name)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhDomainMetaField.colour)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhDomainMetaField.origin)}
            </div>
          </div>
          <div className="mb-2 flex w-full p-2 md:w-[60%]">
            {field(DhDomainMetaField.description)}
          </div>
          {/* The domain's emblem: the shared record image (SPEC-020). */}
          <div className="mb-2 flex w-full p-2">
            {field(DhDomainMetaField.imageId)}
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
