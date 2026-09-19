import { notFound } from "next/navigation";

import fetchDhSubclassClassId from "@/app/lib/data/dhSubclasses/fetchDhSubclassClassId";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import subclassAnchor from "@/app/lib/utils/daggerheart/subclassAnchor";
import { dashboardPath } from "@/i18n/dashboardPath";
import { redirect } from "@/i18n/navigation";

/**
 * Where a link to a subclass lands (SPEC-021 T7): a subclass has no page of
 * its own — it is shown on its class's page (T6) — so this sends the reader
 * there, to the subclass's heading. Search results and formatted-text record
 * links carry only the subclass's id, hence the lookup here.
 */
export default async function DhSubclassRedirect({
  params,
}: PageProps<"/[locale]/dashboard/[system]/subclasses/[id]">) {
  const { id: rawId, system, locale } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0 || !isGameSystem(system)) notFound();

  const classId = await fetchDhSubclassClassId(id);
  if (classId === null) notFound();

  redirect({
    href: dashboardPath(system, `/classes/${classId}#${subclassAnchor(id)}`),
    locale,
  });
}
