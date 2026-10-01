import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import NewMagicItemForm from "./NewMagicItemForm";

// A server component so the campaigns a new record can be revealed to
// (SPEC-022 T6) are in the select on first paint, as the NPC page does for
// factions.
export default async function Page() {
  const optionBundle = {
    dnd5eCampaign: await fetchFieldOptions("dnd5eCampaign"),
  };

  return <NewMagicItemForm optionBundle={optionBundle} />;
}
