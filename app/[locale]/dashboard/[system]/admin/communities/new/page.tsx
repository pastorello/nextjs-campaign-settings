import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import NewDhCommunityForm from "./NewDhCommunityForm";

// Server component so the place and faction selects are populated on first
// paint, as the new-NPC page does for factions (SPEC-006 §7, decision 10).
export default async function Page() {
  const [zone, faction] = await Promise.all([
    fetchFieldOptions("zone"),
    fetchFieldOptions("faction"),
  ]);

  return <NewDhCommunityForm optionBundle={{ zone, faction }} />;
}
