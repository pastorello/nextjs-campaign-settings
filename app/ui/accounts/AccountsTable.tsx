import { getTranslations } from "next-intl/server";

import type Account from "@/app/lib/definitions/interfaces/users/Account";

import AccountRowActions from "./AccountRowActions";

/** Every account, with its actions (SPEC-022 T3). */
export default async function AccountsTable({
  accounts,
  currentUserId,
}: {
  accounts: Account[];
  currentUserId: string;
}) {
  const t = await getTranslations("accounts");

  return (
    <table className="w-full text-left text-sm">
      <caption className="mb-2 text-left text-lg font-semibold">
        {t("page.listTitle")}
      </caption>
      <thead className="border-b border-gray-200 text-gray-600">
        <tr>
          <th scope="col" className="py-2 pr-4 font-medium">
            {t("page.name")}
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            {t("page.email")}
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            {t("page.role")}
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            {t("page.status")}
          </th>
          <th scope="col" className="py-2 font-medium">
            {t("page.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((account) => (
          <tr key={account.id} className="border-b border-gray-100 align-top">
            <th scope="row" className="py-2 pr-4 font-medium">
              {account.name}
              {account.id === currentUserId && (
                <span className="ml-1 font-normal text-gray-600">
                  {t("page.you")}
                </span>
              )}
            </th>
            <td className="py-2 pr-4">{account.email}</td>
            <td className="py-2 pr-4">{t(`roles.${account.role}`)}</td>
            <td className="py-2 pr-4">
              {account.active ? t("statuses.active") : t("statuses.inactive")}
            </td>
            <td className="py-2">
              <AccountRowActions account={account} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
