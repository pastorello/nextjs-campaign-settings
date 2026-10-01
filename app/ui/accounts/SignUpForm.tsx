"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import requestDmAccount from "@/app/lib/data/accounts/requestDmAccount";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import { notifyError } from "@/app/lib/notifications/notify";
import { Link } from "@/i18n/navigation";
import { lusitana } from "@/app/ui/fonts";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import TextInput from "@/app/ui/forms/inputs/TextInput";

/**
 * The logged-out DM sign-up (SPEC-022 T4). The account it asks for is
 * inactive until an active DM activates it. The confirmation reads the same
 * whether the address was free or taken, so the form reveals nothing about
 * who has an account.
 */
export default function SignUpForm() {
  const t = useTranslations("accounts.signUp");
  const tAccounts = useTranslations("accounts");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const result = await requestDmAccount({ name, email, password });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setErrors({});
      setDone(true);
    } catch (error) {
      console.error("Failed to request a DM account:", error);
      notifyError(tAccounts("failed"));
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <section
        aria-labelledby="sign-up-done"
        className="space-y-3 rounded-lg bg-gray-50 px-6 pb-4 pt-8"
      >
        <h1 id="sign-up-done" className={`${lusitana.className} text-2xl`}>
          {t("doneTitle")}
        </h1>
        <p className="text-sm text-gray-700">{t("doneBody")}</p>
        <Link href="/login" className="text-sm text-blue-700 underline">
          {t("backToLogin")}
        </Link>
      </section>
    );
  }

  return (
    <form
      aria-labelledby="sign-up-title"
      className="space-y-3 rounded-lg bg-gray-50 px-6 pb-4 pt-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h1 id="sign-up-title" className={`${lusitana.className} text-2xl`}>
        {t("title")}
      </h1>
      <p className="text-sm text-gray-700">{t("intro")}</p>
      <FormErrorSummary
        errors={errors}
        labels={{
          name: t("name"),
          email: t("email"),
          password: t("password"),
        }}
      />
      <TextInput
        label={t("name")}
        value={name}
        autoComplete="name"
        onChange={(value) => setName(String(value ?? ""))}
      />
      <TextInput
        label={t("email")}
        inputType="email"
        autoComplete="email"
        value={email}
        onChange={(value) => setEmail(String(value ?? ""))}
      />
      <TextInput
        label={t("password")}
        inputType="password"
        autoComplete="new-password"
        value={password}
        onChange={(value) => setPassword(String(value ?? ""))}
      />
      <p className="text-xs text-gray-600">{t("passwordHint")}</p>
      <BaseButton
        type="submit"
        className="w-full"
        buttonState={saving ? ButtonState.Loading : ButtonState.Default}
      >
        {t("submit")}
      </BaseButton>
      <Link href="/login" className="block text-sm text-blue-700 underline">
        {t("backToLogin")}
      </Link>
    </form>
  );
}
