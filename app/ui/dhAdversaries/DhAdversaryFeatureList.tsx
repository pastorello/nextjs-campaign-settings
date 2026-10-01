"use client";

import { useTranslations } from "next-intl";

import createDhAdversaryFeature from "@/app/lib/data/dhAdversaries/createDhAdversaryFeature";
import updateDhAdversaryFeature from "@/app/lib/data/dhAdversaries/updateDhAdversaryFeature";
import deleteDhAdversaryFeatureById from "@/app/lib/data/dhAdversaries/deleteDhAdversaryFeatureById";
import reorderDhAdversaryFeatures from "@/app/lib/data/dhAdversaries/reorderDhAdversaryFeatures";
import DhAdversaryFeature from "@/app/lib/definitions/interfaces/daggerheart/DhAdversaryFeature";
import DhFeatureKind from "@/app/lib/definitions/enums/daggerheart/DhFeatureKind";
import InlineOrderedList from "@/app/ui/daggerheart/InlineOrderedList";
import StatBlockFeatureForm from "@/app/ui/daggerheart/StatBlockFeatureForm";
import StatBlockFeatureLine from "@/app/ui/daggerheart/StatBlockFeatureLine";

/**
 * An adversary's features, in order, edited inline on its edit dialog
 * (SPEC-028 §5, ADR-0011). An adversary may have none.
 */
export default function DhAdversaryFeatureList({
  adversaryId,
  features,
}: {
  adversaryId: number;
  /** In position order. */
  features: DhAdversaryFeature[];
}) {
  const t = useTranslations("dhAdversaries.features");

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
          owner="adversary"
          initial={
            feature && { ...feature, kind: feature.kind as DhFeatureKind }
          }
          save={({ kind, fear, name, text }) =>
            feature
              ? updateDhAdversaryFeature({
                  id: feature.id,
                  kind,
                  fear,
                  name,
                  text,
                })
              : createDhAdversaryFeature({
                  adversaryId,
                  position: features.length + 1,
                  kind,
                  fear,
                  name,
                  text,
                })
          }
          submitLabel={t("saveButton")}
          onDone={onDone}
        />
      )}
      reorder={(orderedIds) =>
        reorderDhAdversaryFeatures(adversaryId, orderedIds)
      }
      remove={deleteDhAdversaryFeatureById}
    />
  );
}
