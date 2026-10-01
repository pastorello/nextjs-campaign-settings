import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** A weapon's burden (`daggerheart.md` §7): one or two hands. */
const dhBurdens: SelectOption<number>[] = [
  { value: 1, labelKey: "daggerheart.burdens.oneHanded" },
  { value: 2, labelKey: "daggerheart.burdens.twoHanded" },
];

export default dhBurdens;
