import { MagicColorObject } from "@/app/lib/config/deity/magicColors";

// colorClass is CSS styling data, not a translatable label — it does not go
// through resolveOptions/ResolvedOption/getDataLabel, which are all about
// message-key resolution (ADR-0007).
const getOptionColorClass = (optionsList: MagicColorObject[], value: number) =>
  optionsList.find((item) => item.value === value)?.colorClass ?? "";

export default getOptionColorClass;
