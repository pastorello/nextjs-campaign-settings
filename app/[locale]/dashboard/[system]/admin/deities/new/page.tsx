import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import NewDeityForm from "./NewDeityForm";

// A server component so the campaigns a new record can be revealed to
// (SPEC-022 T6) are in the select on first paint, as the NPC page does for
// factions.
export default async function Page() {
  const optionBundle = { campaign: await fetchFieldOptions("campaign") };

  return <NewDeityForm optionBundle={optionBundle} />;
}
