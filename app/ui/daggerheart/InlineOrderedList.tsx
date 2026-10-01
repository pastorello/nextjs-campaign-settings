"use client";

import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import PageForm from "@/app/ui/forms/PageForm";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import IconType from "@/app/ui/buttons/BaseButton/IconType";

export interface InlineOrderedListCopy {
  title: string;
  addButton: string;
  moveUp: (name: string) => string;
  moveDown: (name: string) => string;
}

interface InlineOrderedListProps<T extends { id: number; name: string }> {
  /** In position order. */
  items: T[];
  copy: InlineOrderedListCopy;
  /** One row as read. */
  renderItem: (item: T) => ReactNode;
  /**
   * The row's form: empty to add one (`item` undefined), filled to edit
   * one. `onDone` closes it.
   */
  renderForm: (item: T | undefined, onDone: () => void) => ReactNode;
  reorder: (orderedIds: number[]) => Promise<MutationResult>;
  remove: (id: number) => Promise<MutationResult>;
}

/**
 * An owner's ordered rows, edited inline in its edit dialog (ADR-0011):
 * add, edit, move up or down, delete with a confirmation. The shell of
 * SPEC-028's three lists — an adversary's experiences and features, an
 * environment's features; each brings its own form and actions. Same shape
 * as SPEC-021's feature lists, which keep their own copies.
 */
export default function InlineOrderedList<
  T extends { id: number; name: string },
>({
  items,
  copy,
  renderItem,
  renderForm,
  reorder,
  remove,
}: InlineOrderedListProps<T>) {
  const t = useTranslations();
  const router = useRouter();
  const titleId = useId();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(target, 0, moved);

    try {
      const result = await reorder(reordered.map((item) => item.id));
      if (!result.ok) {
        notifyError(t("common.reorder.failed"));
        return;
      }
      router.refresh();
    } catch {
      notifyError(t("common.reorder.failed"));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const result = await remove(pendingDelete.id);
      if (!result.ok) {
        notifyError(t("common.deleteButton.deleteFailed"));
        setPendingDelete(null);
        return;
      }
      notifySuccess(
        t("common.deleteButton.deleted", { name: pendingDelete.name })
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
    <section aria-labelledby={titleId} className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 id={titleId} className="text-lg font-semibold">
          {copy.title}
        </h3>
        <BaseButton onClick={() => setIsAdding(true)} size={ButtonSize.small}>
          {copy.addButton}
        </BaseButton>
      </div>

      {isAdding && (
        <div className="mb-3 rounded-md border p-3">
          {renderForm(undefined, () => setIsAdding(false))}
        </div>
      )}

      <ul className="space-y-2">
        {items.map((item, index) =>
          editingId === item.id ? (
            <li key={item.id} className="rounded-md border p-3">
              {renderForm(item, () => setEditingId(null))}
            </li>
          ) : (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex-1">{renderItem(item)}</div>
              <div className="flex items-center gap-1">
                <BaseButton
                  onClick={() => void move(index, -1)}
                  disabled={index === 0}
                  size={ButtonSize.small}
                  variant={ButtonVariant.secondary}
                  icon={IconType.chevronUp}
                  ariaLabel={copy.moveUp(item.name)}
                />
                <BaseButton
                  onClick={() => void move(index, 1)}
                  disabled={index === items.length - 1}
                  size={ButtonSize.small}
                  variant={ButtonVariant.secondary}
                  icon={IconType.chevronDown}
                  ariaLabel={copy.moveDown(item.name)}
                />
                <BaseButton
                  onClick={() => setEditingId(item.id)}
                  size={ButtonSize.small}
                  variant={ButtonVariant.secondary}
                  ariaLabel={t("common.table.editItem", { name: item.name })}
                >
                  {t("common.table.edit")}
                </BaseButton>
                <BaseButton
                  onClick={() => setPendingDelete(item)}
                  size={ButtonSize.small}
                  variant={ButtonVariant.danger}
                  ariaLabel={t("common.table.deleteItem", { name: item.name })}
                >
                  {t("common.form.delete")}
                </BaseButton>
              </div>
            </li>
          )
        )}
      </ul>

      {pendingDelete && (
        <Modal
          isOpen={pendingDelete !== null}
          setIsOpen={(next) => {
            if (!next) setPendingDelete(null);
          }}
          title={t("common.deleteButton.confirmTitle", {
            name: pendingDelete.name,
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
    </section>
  );
}
