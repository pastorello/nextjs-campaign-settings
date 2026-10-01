import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import SignUpForm from "@/app/ui/accounts/SignUpForm";
import CampaignSettingsLogo from "@/app/ui/icons/CampaignSettingsLogo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accounts.signUp");
  return { title: t("title") };
}

/**
 * The logged-out DM sign-up (SPEC-022 T4), laid out like the login page. It
 * is one of the proxy's two public pages.
 */
export default function SignUpPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-100 flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-blue-500 p-3 md:h-36">
          <CampaignSettingsLogo size="lg" />
        </div>
        <SignUpForm />
      </div>
    </main>
  );
}
