"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import updateAdventure from "@/app/lib/data/campaigns/updateAdventure";
import reorderAdventures from "@/app/lib/data/campaigns/reorderAdventures";
import deleteAdventureById from "@/app/lib/data/campaigns/deleteAdventureById";
import adventureStatuses from "@/app/lib/config/campaigns/adventure-statuses";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";
import Select from "@/app/ui/forms/inputs/Select";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import IconType from "@/app/ui/buttons/BaseButton/IconType";
import type { AdventureSceneProgress } from "@/app/lib/data/campaigns/fetchAdventureSceneProgress";

import AdventureForm from "./AdventureForm";

interface AdventureLadderProps {
  campaignId: number;
  adventures: Adventure[];
  progress: Record<number, AdventureSceneProgress>;
}

/**
 * The campaign page's main content (SPEC-013 §5.2): the adventures, in
 * position order, with a status control and a scene-completion readout per
 * row. Outside the metadata layer (ADR-0011) — there is no admin list page
 * for adventures, only this bespoke ladder.
 *
 * Reordering is two buttons per row rather than drag-and-drop: §9 settled
 * that the DM runs the app from a laptop, pointer or keyboard, never a
 * touch device, and up/down buttons are operable from either without a
 * dependency this app doesn't otherwise have.
 */
export default function AdventureLadder({
  campaignId,
  adventures,
  progress,
}: AdventureLadderProps) {
  const t = useTranslations();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Adventure | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusOptions = resolveOptions(adventureStatuses, t);

  async function handleStatusChange(adventure: Adventure, status: string) {
    const result = await updateAdventure({
      id: adventure.id,
      status: status as AdventureStatus,
    } as Adventure);

    if (!result.ok) {
      notifyError(t("common.deleteButton.deleteFailed"));
      return;
    }
    router.refresh();
  }

  async function moveAdventure(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= adventures.length) return;

    const reordered = [...adventures];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    const result = await reorderAdventures(
      campaignId,
      reordered.map((adventure) => adventure.id)
    );

    if (!result.ok) {
      notifyError(t("common.deleteButton.deleteFailed"));
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdventureById(pendingDelete.id);
      notifySuccess(
        t("common.deleteButton.deleted", { name: pendingDelete.title })
      );
      setPendingDelete(null);
      router.refresh();
    } catch {
      notifyError(t("common.deleteButton.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("adventure.ladder.title")}</h2>
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {t("adventure.ladder.addButton")}
        </BaseButton>
      </div>

      {isAdding && (
        <div className="mb-6 rounded-md border p-4">
          <AdventureForm
            campaignId={campaignId}
            nextPosition={adventures.length + 1}
            onCancel={() => setIsAdding(false)}
            onSaved={() => setIsAdding(false)}
          />
        </div>
      )}

      {adventures.length === 0 ? (
        <p>{t("adventure.ladder.emptyMessage")}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th scope="col" className="px-3 py-2 font-medium">
                {t("adventure.fields.position.label")}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {t("adventure.fields.targetLevel.label")}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {t("adventure.fields.title.label")}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {t("adventure.fields.status.label")}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {t("adventure.ladder.columns.progress")}
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                {t("common.table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {adventures.map((adventure, index) => {
              const rowProgress = progress[adventure.id] ?? {
                total: 0,
                awarded: 0,
              };
              return (
                <tr key={adventure.id} className="border-b last:border-none">
                  <td className="px-3 py-3">{adventure.position}</td>
                  <td className="px-3 py-3">{adventure.targetLevel}</td>
                  <td className="px-3 py-3">{adventure.title}</td>
                  <td className="px-3 py-3">
                    <Select
                      value={adventure.status}
                      options={statusOptions}
                      onChange={(value) =>
                        void handleStatusChange(adventure, String(value))
                      }
                    />
                  </td>
                  <td className="px-3 py-3">
                    {t("adventure.ladder.columns.progressReadout", {
                      awarded: rowProgress.awarded,
                      total: rowProgress.total,
                    })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <BaseButton
                        onClick={() => void moveAdventure(index, -1)}
                        disabled={index === 0}
                        size={ButtonSize.small}
                        variant={ButtonVariant.secondary}
                        icon={IconType.chevronUp}
                        ariaLabel={t("adventure.ladder.moveUp", {
                          title: adventure.title,
                        })}
                      />
                      <BaseButton
                        onClick={() => void moveAdventure(index, 1)}
                        disabled={index === adventures.length - 1}
                        size={ButtonSize.small}
                        variant={ButtonVariant.secondary}
                        icon={IconType.chevronDown}
                        ariaLabel={t("adventure.ladder.moveDown", {
                          title: adventure.title,
                        })}
                      />
                      <BaseButton
                        onClick={() => setPendingDelete(adventure)}
                        size={ButtonSize.small}
                        variant={ButtonVariant.danger}
                      >
                        {t("common.form.delete")}
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {pendingDelete && (
        <Modal
          isOpen={pendingDelete !== null}
          setIsOpen={(next) => {
            if (!next) setPendingDelete(null);
          }}
          title={t("common.deleteButton.confirmTitle", {
            name: pendingDelete.title,
          })}
          description={t("common.deleteButton.confirmDescription")}
          size="small"
        >
          <PageForm
            onCancel={() => setPendingDelete(null)}
            onSaveFinished={() => void handleDelete()}
            isSaving={isDeleting}
          />
        </Modal>
      )}
    </div>
  );
}
