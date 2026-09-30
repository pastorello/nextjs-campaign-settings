"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import createAccount from "@/app/lib/data/accounts/createAccount";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import UserRole, { USER_ROLES } from "@/app/lib/definitions/UserRole";
import { useRouter } from "@/i18n/navigation";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import Select from "@/app/ui/forms/inputs/Select";
import TextInput from "@/app/ui/forms/inputs/TextInput";

/**
 * Creates an account (SPEC-022 T3). A player by default: the DM's own
 * sign-up is T4's, and a second DM is the rarer case. The DM picks the first
 * password and tells it to the person, since the app sends no mail.
 */
export default function NewAccountForm() {
  const t = useTranslations("accounts");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("player");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setSaving(true);
    try {
      const result = await createAccount({ name, email, password, role });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setErrors({});
      setName("");
      setEmail("");
      setPassword("");
      setRole("player");
      notifySuccess(t("page.created"));
      router.refresh();
    } catch (error) {
      console.error("Failed to create an account:", error);
      notifyError(t("failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      aria-labelledby="new-account"
      className="max-w-lg space-y-3 rounded-lg border border-gray-200 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void create();
      }}
    >
      <h2 id="new-account" className="text-lg font-semibold">
        {t("page.newTitle")}
      </h2>
      <FormErrorSummary
        errors={errors}
        labels={{
          name: t("page.name"),
          email: t("page.email"),
          password: t("page.password"),
          role: t("page.role"),
        }}
      />
      <TextInput
        label={t("page.name")}
        value={name}
        onChange={(value) => setName(String(value ?? ""))}
      />
      <TextInput
        label={t("page.email")}
        inputType="email"
        autoComplete="off"
        value={email}
        onChange={(value) => setEmail(String(value ?? ""))}
      />
      <TextInput
        label={t("page.password")}
        inputType="password"
        autoComplete="new-password"
        value={password}
        onChange={(value) => setPassword(String(value ?? ""))}
      />
      <p className="text-xs text-gray-600">{t("page.firstPasswordHint")}</p>
      <Select
        label={t("page.role")}
        value={role}
        onChange={(value) => setRole(value === "dm" ? "dm" : "player")}
        options={USER_ROLES.map((option) => ({
          value: option,
          label: t(`roles.${option}`),
        }))}
      />
      <BaseButton
        type="submit"
        buttonState={saving ? ButtonState.Loading : ButtonState.Default}
      >
        {t("page.create")}
      </BaseButton>
    </form>
  );
}
