"use server";

import { getTranslations } from "next-intl/server";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import logServerIssue from "../notifications/logServerIssue";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      // Server-side: the user already gets the returned message on the form.
      logServerIssue(`Sign-in failed: ${error.type}`);
      const t = await getTranslations("common.auth");
      switch (error.type) {
        case "CredentialsSignin":
          return t("invalidCredentials");
        default:
          return t("somethingWrong");
      }
    }
    throw error;
  }

  return undefined;
}
