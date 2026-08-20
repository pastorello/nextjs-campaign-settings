/**
 * SPEC-015 T6 — presentation of the metre figures `grid.ts` computes:
 * metres below one kilometre, kilometres from there up, in the viewer's
 * locale ("1,5 m" in Italian, "1.5 m" in English). Kept apart from
 * `grid.ts` deliberately: that file converts, this one renders, and both
 * the grid legend and the measurement label (T7) read from here.
 */
export function formatMeters(meters: number, locale: string): string {
  const inKilometers = meters >= 1000;
  const value = inKilometers ? meters / 1000 : meters;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted} ${inKilometers ? "km" : "m"}`;
}
