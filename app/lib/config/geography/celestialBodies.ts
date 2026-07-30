import CelestialBody from "../../definitions/enums/geography/CelestialBody";
import SelectOption from "../../definitions/types/SelectOption";

const celestialBodies: SelectOption<number>[] = [
  { value: CelestialBody.Acquario, label: "Acquario" },
  { value: CelestialBody.Ariete, label: "Ariete" },
  { value: CelestialBody.Bilancia, label: "Bilancia" },
  { value: CelestialBody.Cancro, label: "Cancro" },
  { value: CelestialBody.Capricorno, label: "Capricorno" },
  { value: CelestialBody.Gemelli, label: "Gemelli" },
  { value: CelestialBody.Giove, label: "Giove" },
  { value: CelestialBody.Leone, label: "Leone" },
  { value: CelestialBody.Luna, label: "Luna" },
  { value: CelestialBody.Marte, label: "Marte" },
  { value: CelestialBody.Mercurio, label: "Mercurio" },
  { value: CelestialBody.Nettuno, label: "Nettuno" },
  { value: CelestialBody.Pesci, label: "Pesci" },
  { value: CelestialBody.Sagittario, label: "Sagittario" },
  { value: CelestialBody.Saturno, label: "Saturno" },
  { value: CelestialBody.Scorpione, label: "Scorpione" },
  { value: CelestialBody.Sole, label: "Sole" },
  { value: CelestialBody.Terra, label: "Terra" },
  { value: CelestialBody.Toro, label: "Toro" },
  { value: CelestialBody.Urano, label: "Urano" },
  { value: CelestialBody.Venere, label: "Venere" },
  { value: CelestialBody.Vergine, label: "Vergine" },
];

export default celestialBodies;
