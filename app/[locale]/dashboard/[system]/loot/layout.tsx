import assertPageSystem from "@/app/lib/config/assertPageSystem";
import requireDmPage from "@/app/lib/auth/requireDmPage";
import PageType from "@/app/lib/definitions/types/PageType";

// A Daggerheart catalogue: a 404 under any other system (ADR-0013 rule 4).
// Loot is handed out, so it is the DM's alone (SPEC-029 §9 decision 1): the
// proxy refuses a player first, and this is the second layer (ADR-0020).
export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard/[system]/loot">) {
  assertPageSystem(PageType.DhLoot, (await params).system);
  await requireDmPage();
  return children;
}
