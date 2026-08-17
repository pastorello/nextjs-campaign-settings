import SavingThrow from "@/app/lib/definitions/interfaces/spells/SavingThrow";

const savingThrows: SavingThrow[] = [
  { value: "Nessuno", labelKey: "spells.savingThrows.none" },
  { value: "Forza", labelKey: "spells.savingThrows.strength" },
  { value: "Destrezza", labelKey: "spells.savingThrows.dexterity" },
  { value: "Costituzione", labelKey: "spells.savingThrows.constitution" },
  { value: "Intelligenza", labelKey: "spells.savingThrows.intelligence" },
  { value: "Saggezza", labelKey: "spells.savingThrows.wisdom" },
  { value: "Carisma", labelKey: "spells.savingThrows.charisma" },
];

export default savingThrows;
