import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import requireDmPage from "@/app/lib/auth/requireDmPage";
import fetchOwnAccount from "@/app/lib/data/accounts/fetchOwnAccount";
import OwnAccountForms from "@/app/ui/accounts/OwnAccountForms";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accounts.ownPage");
  return { title: t("title") };
}

/** The signed-in DM's own account (SPEC-022 T2). */
export default async function AccountPage() {
  await requireDmPage();
  const t = await getTranslations("accounts.ownPage");
  const account = await fetchOwnAccount();
  // The proxy has already checked the account exists; a row deleted in the
  // instant between is a 404.
  if (!account) notFound();

  return (
    <div className="w-full">
      <PageTitle className="mb-6">{t("title")}</PageTitle>
      <OwnAccountForms name={account.name} email={account.email} />
    </div>
  );
}
