"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import deleteAccount from "@/app/lib/data/accounts/deleteAccount";
import setAccountActive from "@/app/lib/data/accounts/setAccountActive";
import setAccountPassword from "@/app/lib/data/accounts/setAccountPassword";
import updateAccount from "@/app/lib/data/accounts/updateAccount";
import type Account from "@/app/lib/definitions/interfaces/users/Account";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import UserRole, { USER_ROLES } from "@/app/lib/definitions/UserRole";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import { useRouter } from "@/i18n/navigation";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import Modal from "@/app/ui/components/Modal";
import Select from "@/app/ui/forms/inputs/Select";
import TextInput from "@/app/ui/forms/inputs/TextInput";

type Dialog = "edit" | "password" | "delete" | null;

/**
 * One account's actions on the accounts page (SPEC-022 T3): edit its name
 * and role, set its password (the hand-performed reset, §9), disable or
 * activate it, and delete it. Each button names the account, since a row of
 * identical "Edit" buttons tells a screen reader nothing. The last-DM
 * refusals come back from the server and are shown as they are.
 */
export default function AccountRowActions({ account }: { account: Account }) {
  const t = useTranslations("accounts");
  const tRoot = useTranslations();
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState(account.name);
  const [role, setRole] = useState<UserRole>(account.role);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const open = (next: Dialog) => {
    setName(account.name);
    setRole(account.role);
    setPassword("");
    setErrors({});
    setDialog(next);
  };

  /**
   * Runs one mutation. Inside a dialog its field errors stay in the dialog;
   * a refusal of a button without a dialog becomes a toast.
   */
  const run = async (
    mutation: () => Promise<MutationResult>,
    success: string,
    { inDialog }: { inDialog: boolean }
  ) => {
    setBusy(true);
    try {
      const result = await mutation();
      if (!result.ok) {
        if (inDialog) setErrors(result.errors);
        else
          notifyError(
            resolveFirstFieldError(result.errors, tRoot) ?? t("failed")
          );
        return;
      }
      setDialog(null);
      notifySuccess(success);
      router.refresh();
    } catch (error) {
      console.error("An account action failed:", error);
      notifyError(t("failed"));
    } finally {
      setBusy(false);
    }
  };

  const labels = {
    name: t("page.name"),
    role: t("page.role"),
    password: t("page.password"),
  };

  return (
    <div className="flex flex-wrap gap-2">
      <BaseButton
        size={ButtonSize.small}
        variant={ButtonVariant.secondary}
        onClick={() => open("edit")}
      >
        {t("page.edit", { name: account.name })}
      </BaseButton>
      <BaseButton
        size={ButtonSize.small}
        variant={ButtonVariant.secondary}
        onClick={() => open("password")}
      >
        {t("page.setPassword", { name: account.name })}
      </BaseButton>
      <BaseButton
        size={ButtonSize.small}
        variant={ButtonVariant.secondary}
        disabled={busy}
        onClick={() =>
          void run(
            () => setAccountActive({ id: account.id, active: !account.active }),
            account.active ? t("page.disabled") : t("page.activated"),
            { inDialog: false }
          )
        }
      >
        {account.active
          ? t("page.disable", { name: account.name })
          : t("page.activate", { name: account.name })}
      </BaseButton>
      <BaseButton
        size={ButtonSize.small}
        variant={ButtonVariant.ghostDanger}
        onClick={() => open("delete")}
      >
        {t("page.delete", { name: account.name })}
      </BaseButton>

      <Modal
        isOpen={dialog === "edit"}
        setIsOpen={(value) => {
          if (!value) setDialog(null);
        }}
        title={t("page.editTitle", { name: account.name })}
        size="small"
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(
              () => updateAccount({ id: account.id, name, role }),
              t("page.saved"),
              { inDialog: true }
            );
          }}
        >
          <FormErrorSummary errors={errors} labels={labels} />
          <TextInput
            label={t("page.name")}
            value={name}
            onChange={(value) => setName(String(value ?? ""))}
          />
          <Select
            label={t("page.role")}
            value={role}
            onChange={(value) => setRole(value === "dm" ? "dm" : "player")}
            options={USER_ROLES.map((option) => ({
              value: option,
              label: t(`roles.${option}`),
            }))}
          />
          <div className="flex justify-end gap-2">
            <BaseButton
              variant={ButtonVariant.neutral}
              onClick={() => setDialog(null)}
            >
              {t("page.cancel")}
            </BaseButton>
            <BaseButton type="submit" disabled={busy}>
              {t("page.save")}
            </BaseButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={dialog === "password"}
        setIsOpen={(value) => {
          if (!value) setDialog(null);
        }}
        title={t("page.setPasswordTitle", { name: account.name })}
        size="small"
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(
              () => setAccountPassword({ id: account.id, password }),
              t("page.passwordSet", { name: account.name }),
              { inDialog: true }
            );
          }}
        >
          <FormErrorSummary errors={errors} labels={labels} />
          <TextInput
            label={t("page.password")}
            inputType="password"
            autoComplete="new-password"
            value={password}
            onChange={(value) => setPassword(String(value ?? ""))}
          />
          <p className="text-xs text-gray-600">{t("page.firstPasswordHint")}</p>
          <div className="flex justify-end gap-2">
            <BaseButton
              variant={ButtonVariant.neutral}
              onClick={() => setDialog(null)}
            >
              {t("page.cancel")}
            </BaseButton>
            <BaseButton type="submit" disabled={busy}>
              {t("page.save")}
            </BaseButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={dialog === "delete"}
        setIsOpen={(value) => {
          if (!value) setDialog(null);
        }}
        title={t("page.deleteTitle", { name: account.name })}
        description={t("page.deleteBody")}
        size="small"
      >
        <FormErrorSummary errors={errors} labels={labels} />
        <div className="flex justify-end gap-2">
          <BaseButton
            variant={ButtonVariant.neutral}
            onClick={() => setDialog(null)}
          >
            {t("page.cancel")}
          </BaseButton>
          <BaseButton
            variant={ButtonVariant.danger}
            disabled={busy}
            onClick={() =>
              void run(
                () => deleteAccount({ id: account.id }),
                t("page.deleted"),
                { inDialog: true }
              )
            }
          >
            {t("page.confirmDelete")}
          </BaseButton>
        </div>
      </Modal>
    </div>
  );
}
