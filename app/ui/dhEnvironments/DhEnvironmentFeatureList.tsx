"use client";

import { useTranslations } from "next-intl";

import createDhEnvironmentFeature from "@/app/lib/data/dhEnvironments/createDhEnvironmentFeature";
import updateDhEnvironmentFeature from "@/app/lib/data/dhEnvironments/updateDhEnvironmentFeature";
import deleteDhEnvironmentFeatureById from "@/app/lib/data/dhEnvironments/deleteDhEnvironmentFeatureById";
import reorderDhEnvironmentFeatures from "@/app/lib/data/dhEnvironments/reorderDhEnvironmentFeatures";
import DhEnvironmentFeature from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironmentFeature";
import DhFeatureKind from "@/app/lib/definitions/enums/daggerheart/DhFeatureKind";
import InlineOrderedList from "@/app/ui/daggerheart/InlineOrderedList";
import StatBlockFeatureForm from "@/app/ui/daggerheart/StatBlockFeatureForm";
import StatBlockFeatureLine from "@/app/ui/daggerheart/StatBlockFeatureLine";

/**
 * An environment's features, in order, edited inline on its edit dialog
 * (SPEC-028 §5, ADR-0011). An environment may have none.
 */
export default function DhEnvironmentFeatureList({
  environmentId,
  features,
}: {
  environmentId: number;
  /** In position order. */
  features: DhEnvironmentFeature[];
}) {
  const t = useTranslations("dhEnvironments.features");

  return (
    <InlineOrderedList
      items={features}
      copy={{
        title: t("title"),
        addButton: t("addButton"),
        moveUp: (name) => t("moveUp", { name }),
        moveDown: (name) => t("moveDown", { name }),
      }}
      renderItem={(feature) => <StatBlockFeatureLine feature={feature} />}
      renderForm={(feature, onDone) => (
        <StatBlockFeatureForm
          owner="environment"
          initial={
            feature && {
              kind: feature.kind as DhFeatureKind,
              name: feature.name,
              text: feature.text,
              questions: feature.questions ?? "",
            }
          }
          save={({ kind, name, text, questions }) =>
            feature
              ? updateDhEnvironmentFeature({
                  id: feature.id,
                  kind,
                  name,
                  text,
                  questions,
                })
              : createDhEnvironmentFeature({
                  environmentId,
                  position: features.length + 1,
                  kind,
                  name,
                  text,
                  questions,
                })
          }
          submitLabel={t("saveButton")}
          onDone={onDone}
        />
      )}
      reorder={(orderedIds) =>
        reorderDhEnvironmentFeatures(environmentId, orderedIds)
      }
      remove={deleteDhEnvironmentFeatureById}
    />
  );
}
