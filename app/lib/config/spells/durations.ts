import Duration from "@/app/lib/definitions/interfaces/spells/Duration";

const durations: Duration[] = [
  { value: "Istantanea", labelKey: "spells.durations.instantaneous" },
  {
    value: "Concentrazione01",
    labelKey: "spells.durations.concentration1Round",
  },
  {
    value: "Concentrazione06",
    labelKey: "spells.durations.concentration6Rounds",
  },
  {
    value: "Concentrazione1",
    labelKey: "spells.durations.concentration1Minute",
  },
  {
    value: "Concentrazione10",
    labelKey: "spells.durations.concentration10Minutes",
  },
  {
    value: "Concentrazione60",
    labelKey: "spells.durations.concentration1Hour",
  },
  {
    value: "Concentrazione120",
    labelKey: "spells.durations.concentration2Hours",
  },
  {
    value: "Concentrazione480",
    labelKey: "spells.durations.concentration8Hours",
  },
  {
    value: "Concentrazione1g",
    labelKey: "spells.durations.concentration24Hours",
  },
  { value: "1 round", labelKey: "spells.durations.round1" },
  { value: "1 minuto", labelKey: "spells.durations.minute1" },
  { value: "10 minuti", labelKey: "spells.durations.minutes10" },
  { value: "1 ora", labelKey: "spells.durations.hour1" },
  { value: "8 ore", labelKey: "spells.durations.hours8" },
  { value: "24 ore", labelKey: "spells.durations.hours24" },
  { value: "7 giorni", labelKey: "spells.durations.days7" },
  { value: "10 giorni", labelKey: "spells.durations.days10" },
  { value: "30 giorni", labelKey: "spells.durations.days30" },
  { value: "Permanente", labelKey: "spells.durations.untilDispelled" },
  {
    value: "Innesco",
    labelKey: "spells.durations.untilDispelledOrTriggered",
  },
  { value: "Speciale", labelKey: "spells.durations.special" },
];

export default durations;
