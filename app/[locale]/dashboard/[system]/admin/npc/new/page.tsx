import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import NewNpcForm from "./NewNpcForm";

// Server component so the faction select is populated on first paint
// (SPEC-006 §7, decision 10) — this route has no other server ancestor to
// resolve the bundle from, unlike the admin list's edit modal.
export default async function Page() {
  const optionBundle = { faction: await fetchFieldOptions("faction") };

  return <NewNpcForm optionBundle={optionBundle} />;
}
