import assertPageSystem from "@/app/lib/config/assertPageSystem";
import PageType from "@/app/lib/definitions/types/PageType";

// A 5e catalogue: a 404 under any other system (ADR-0013 rule 4).
export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard/[system]/admin/magicitems">) {
  assertPageSystem(PageType.MagicItem, (await params).system);
  return children;
}
