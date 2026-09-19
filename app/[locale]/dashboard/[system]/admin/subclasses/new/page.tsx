import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import NewDhSubclassForm from "./NewDhSubclassForm";

// Server component so the class select is populated on first paint, as the
// new-NPC page does for its faction (SPEC-006 §7, decision 10).
export default async function Page() {
  const optionBundle = { dhClass: await fetchFieldOptions("dhClass") };

  return <NewDhSubclassForm optionBundle={optionBundle} />;
}
