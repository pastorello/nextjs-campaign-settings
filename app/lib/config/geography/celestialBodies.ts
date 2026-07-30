import CelestialBody from "../../definitions/enums/geography/CelestialBody";
import SelectOption from "../../definitions/types/SelectOption";

const celestialBodies: SelectOption<number>[] = [
  {
    value: CelestialBody.Acquario,
    labelKey: "geography.celestialBodies.acquario",
  },
  { value: CelestialBody.Ariete, labelKey: "geography.celestialBodies.ariete" },
  {
    value: CelestialBody.Bilancia,
    labelKey: "geography.celestialBodies.bilancia",
  },
  { value: CelestialBody.Cancro, labelKey: "geography.celestialBodies.cancro" },
  {
    value: CelestialBody.Capricorno,
    labelKey: "geography.celestialBodies.capricorno",
  },
  {
    value: CelestialBody.Gemelli,
    labelKey: "geography.celestialBodies.gemelli",
  },
  { value: CelestialBody.Giove, labelKey: "geography.celestialBodies.giove" },
  { value: CelestialBody.Leone, labelKey: "geography.celestialBodies.leone" },
  { value: CelestialBody.Luna, labelKey: "geography.celestialBodies.luna" },
  { value: CelestialBody.Marte, labelKey: "geography.celestialBodies.marte" },
  {
    value: CelestialBody.Mercurio,
    labelKey: "geography.celestialBodies.mercurio",
  },
  {
    value: CelestialBody.Nettuno,
    labelKey: "geography.celestialBodies.nettuno",
  },
  { value: CelestialBody.Pesci, labelKey: "geography.celestialBodies.pesci" },
  {
    value: CelestialBody.Sagittario,
    labelKey: "geography.celestialBodies.sagittario",
  },
  {
    value: CelestialBody.Saturno,
    labelKey: "geography.celestialBodies.saturno",
  },
  {
    value: CelestialBody.Scorpione,
    labelKey: "geography.celestialBodies.scorpione",
  },
  { value: CelestialBody.Sole, labelKey: "geography.celestialBodies.sole" },
  { value: CelestialBody.Terra, labelKey: "geography.celestialBodies.terra" },
  { value: CelestialBody.Toro, labelKey: "geography.celestialBodies.toro" },
  { value: CelestialBody.Urano, labelKey: "geography.celestialBodies.urano" },
  { value: CelestialBody.Venere, labelKey: "geography.celestialBodies.venere" },
  {
    value: CelestialBody.Vergine,
    labelKey: "geography.celestialBodies.vergine",
  },
];

export default celestialBodies;
