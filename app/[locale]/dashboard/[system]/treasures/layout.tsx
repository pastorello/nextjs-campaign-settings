import assertPageSystem from "@/app/lib/config/assertPageSystem";
import requireDmPage from "@/app/lib/auth/requireDmPage";
import PageType from "@/app/lib/definitions/types/PageType";

// A 5e catalogue: a 404 under any other system (ADR-0013 rule 4). The
// treasure catalogue is also the DM's alone (SPEC-022 R15): the proxy
// refuses a player first, and this is the second layer (ADR-0020).
export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard/[system]/treasures">) {
  assertPageSystem(PageType.Treasure, (await params).system);
  await requireDmPage();
  return children;
}
