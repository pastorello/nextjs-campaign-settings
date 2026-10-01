"use client";

import { useTranslations } from "next-intl";

import createDhAdversaryExperience from "@/app/lib/data/dhAdversaries/createDhAdversaryExperience";
import updateDhAdversaryExperience from "@/app/lib/data/dhAdversaries/updateDhAdversaryExperience";
import deleteDhAdversaryExperienceById from "@/app/lib/data/dhAdversaries/deleteDhAdversaryExperienceById";
import reorderDhAdversaryExperiences from "@/app/lib/data/dhAdversaries/reorderDhAdversaryExperiences";
import DhAdversaryExperience from "@/app/lib/definitions/interfaces/daggerheart/DhAdversaryExperience";
import InlineOrderedList from "@/app/ui/daggerheart/InlineOrderedList";

import DhAdversaryExperienceForm from "./DhAdversaryExperienceForm";
import formatBonus from "./formatBonus";

/**
 * An adversary's experiences, in order, edited inline on its edit dialog
 * (SPEC-028 §5, ADR-0011). An adversary may have none.
 */
export default function DhAdversaryExperienceList({
  adversaryId,
  experiences,
}: {
  adversaryId: number;
  /** In position order. */
  experiences: DhAdversaryExperience[];
}) {
  const t = useTranslations("dhAdversaries.experiences");

  return (
    <InlineOrderedList
      items={experiences}
      copy={{
        title: t("title"),
        addButton: t("addButton"),
        moveUp: (name) => t("moveUp", { name }),
        moveDown: (name) => t("moveDown", { name }),
      }}
      renderItem={(experience) => (
        <p>
          <span className="font-medium">{experience.name}</span>{" "}
          {formatBonus(experience.bonus)}
        </p>
      )}
      renderForm={(experience, onDone) => (
        <DhAdversaryExperienceForm
          initial={experience}
          save={({ name, bonus }) =>
            experience
              ? updateDhAdversaryExperience({
                  id: experience.id,
                  name,
                  bonus: Number(bonus),
                })
              : createDhAdversaryExperience({
                  adversaryId,
                  position: experiences.length + 1,
                  name,
                  bonus: Number(bonus),
                })
          }
          submitLabel={t("saveButton")}
          onDone={onDone}
        />
      )}
      reorder={(orderedIds) =>
        reorderDhAdversaryExperiences(adversaryId, orderedIds)
      }
      remove={deleteDhAdversaryExperienceById}
    />
  );
}
