import Astro from "../../definitions/enums/geography/Astro";
import SelectOption from "../../definitions/types/SelectOption";

const celestialBodies: SelectOption[] = [
  { value: Astro.Acquario, label: "Acquario" },
  { value: Astro.Ariete, label: "Ariete" },
  { value: Astro.Bilancia, label: "Bilancia" },
  { value: Astro.Cancro, label: "Cancro" },
  { value: Astro.Capricorno, label: "Capricorno" },
  { value: Astro.Gemelli, label: "Gemelli" },
  { value: Astro.Giove, label: "Giove" },
  { value: Astro.Leone, label: "Leone" },
  { value: Astro.Luna, label: "Luna" },
  { value: Astro.Marte, label: "Marte" },
  { value: Astro.Mercurio, label: "Mercurio" },
  { value: Astro.Nettuno, label: "Nettuno" },
  { value: Astro.Pesci, label: "Pesci" },
  { value: Astro.Sagittario, label: "Sagittario" },
  { value: Astro.Saturno, label: "Saturno" },
  { value: Astro.Scorpione, label: "Scorpione" },
  { value: Astro.Sole, label: "Sole" },
  { value: Astro.Terra, label: "Terra" },
  { value: Astro.Toro, label: "Toro" },
  { value: Astro.Urano, label: "Urano" },
  { value: Astro.Venere, label: "Venere" },
  { value: Astro.Vergine, label: "Vergine" },
];

export default celestialBodies;
