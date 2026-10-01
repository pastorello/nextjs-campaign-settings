"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import changeOwnPassword from "@/app/lib/data/accounts/changeOwnPassword";
import updateOwnName from "@/app/lib/data/accounts/updateOwnName";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import TextInput from "@/app/ui/forms/inputs/TextInput";

/**
 * The signed-in DM's own account (SPEC-022 T2): their name, and their
 * password behind the current one. The email is shown, not edited here:
 * it is how the account signs in, so changing it is another DM's call from
 * the accounts page.
 */
export default function OwnAccountForms({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const t = useTranslations("accounts");
  const [name, setName] = useState(initialName);
  const [nameErrors, setNameErrors] = useState<FieldErrors>({});
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [savingPassword, setSavingPassword] = useState(false);

  const saveName = async () => {
    setSavingName(true);
    try {
      const result = await updateOwnName({ name });
      if (!result.ok) {
        setNameErrors(result.errors);
        return;
      }
      setNameErrors({});
      notifySuccess(t("ownPage.nameSaved"));
    } catch (error) {
      console.error("Failed to rename the signed-in account:", error);
      notifyError(t("failed"));
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    setSavingPassword(true);
    try {
      const result = await changeOwnPassword({ currentPassword, newPassword });
      if (!result.ok) {
        setPasswordErrors(result.errors);
        return;
      }
      setPasswordErrors({});
      setCurrentPassword("");
      setNewPassword("");
      notifySuccess(t("ownPage.passwordChanged"));
    } catch (error) {
      console.error(
        "Failed to change the signed-in account's password:",
        error
      );
      notifyError(t("failed"));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-lg space-y-8">
      <form
        aria-labelledby="own-account-name"
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void saveName();
        }}
      >
        <h2 id="own-account-name" className="text-lg font-semibold">
          {t("ownPage.nameSection")}
        </h2>
        <FormErrorSummary
          errors={nameErrors}
          labels={{ name: t("ownPage.name") }}
        />
        <TextInput
          label={t("ownPage.name")}
          value={name}
          autoComplete="name"
          onChange={(value) => setName(String(value ?? ""))}
        />
        <p className="text-sm text-gray-600">
          {t("ownPage.email")}: {email}
        </p>
        <p className="text-xs text-gray-600">{t("ownPage.emailHint")}</p>
        <BaseButton
          type="submit"
          buttonState={savingName ? ButtonState.Loading : ButtonState.Default}
        >
          {t("ownPage.saveName")}
        </BaseButton>
      </form>

      <form
        aria-labelledby="own-account-password"
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void savePassword();
        }}
      >
        <h2 id="own-account-password" className="text-lg font-semibold">
          {t("ownPage.passwordSection")}
        </h2>
        <FormErrorSummary
          errors={passwordErrors}
          labels={{
            currentPassword: t("ownPage.currentPassword"),
            newPassword: t("ownPage.newPassword"),
          }}
        />
        <TextInput
          label={t("ownPage.currentPassword")}
          inputType="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(value) => setCurrentPassword(String(value ?? ""))}
        />
        <TextInput
          label={t("ownPage.newPassword")}
          inputType="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(value) => setNewPassword(String(value ?? ""))}
        />
        <p className="text-xs text-gray-600">{t("ownPage.passwordHint")}</p>
        <BaseButton
          type="submit"
          buttonState={
            savingPassword ? ButtonState.Loading : ButtonState.Default
          }
        >
          {t("ownPage.changePassword")}
        </BaseButton>
      </form>
    </div>
  );
}
