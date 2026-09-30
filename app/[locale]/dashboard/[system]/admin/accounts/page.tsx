import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import requireDmPage from "@/app/lib/auth/requireDmPage";
import fetchAccounts from "@/app/lib/data/accounts/fetchAccounts";
import AccountsTable from "@/app/ui/accounts/AccountsTable";
import NewAccountForm from "@/app/ui/accounts/NewAccountForm";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accounts.page");
  return { title: t("title") };
}

/**
 * The DM's accounts page (SPEC-022 T3): who can sign in, as what, and the
 * ways to change that. Outside the metadata layer, as SPEC-022 §7 decided:
 * `role` is no metadata field, and nothing else lists users.
 */
export default async function AccountsPage() {
  await requireDmPage();
  const t = await getTranslations("accounts.page");
  const [session, accounts] = await Promise.all([auth(), fetchAccounts()]);

  return (
    <div className="w-full space-y-8">
      <div>
        <PageTitle className="mb-2">{t("title")}</PageTitle>
        <p className="max-w-2xl text-sm text-gray-700">{t("intro")}</p>
      </div>
      <NewAccountForm />
      <AccountsTable
        accounts={accounts}
        currentUserId={session?.user.id ?? ""}
      />
    </div>
  );
}
