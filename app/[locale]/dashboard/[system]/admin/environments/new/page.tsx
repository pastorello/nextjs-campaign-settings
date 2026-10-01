import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import NewDhEnvironmentForm from "./NewDhEnvironmentForm";

// Server component so the adversary and place selects are populated on
// first paint, as the new-community page does (SPEC-006 §7, decision 10).
export default async function Page() {
  const [dhAdversary, zone] = await Promise.all([
    fetchFieldOptions("dhAdversary"),
    fetchFieldOptions("zone"),
  ]);

  return <NewDhEnvironmentForm optionBundle={{ dhAdversary, zone }} />;
}
