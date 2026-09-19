import DhOrigin from "@/app/lib/definitions/enums/daggerheart/DhOrigin";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** `DhOrigin`'s select options — homebrew first, the default (SPEC-021 §6). */
const dhOrigins: SelectOption<DhOrigin>[] = [
  { value: DhOrigin.Homebrew, labelKey: "daggerheart.origins.homebrew" },
  {
    value: DhOrigin.SrdReference,
    labelKey: "daggerheart.origins.srdReference",
  },
];

export default dhOrigins;
