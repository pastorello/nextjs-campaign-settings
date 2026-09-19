import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import NewDhClassForm from "./NewDhClassForm";

// Server component so the domain selects are populated on first paint, as
// the new-NPC page does for its faction (SPEC-006 §7, decision 10).
export default async function Page() {
  const optionBundle = { dhDomain: await fetchFieldOptions("dhDomain") };

  return <NewDhClassForm optionBundle={optionBundle} />;
}
