import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import NewDhDomainCardForm from "./NewDhDomainCardForm";

// Server component so the domain select is populated on first paint, as the
// new-NPC page does for factions (SPEC-006 §7, decision 10).
export default async function Page() {
  const optionBundle = { dhDomain: await fetchFieldOptions("dhDomain") };

  return <NewDhDomainCardForm optionBundle={optionBundle} />;
}
