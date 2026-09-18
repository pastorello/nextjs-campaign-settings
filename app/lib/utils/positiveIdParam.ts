/**
 * A positive whole number from one URL parameter, else `null` — a filter
 * that is not an id reads as "any". The URL is the viewer's to edit, so a
 * bad value is not an error.
 */
export default function positiveIdParam(
  raw: string | string[] | undefined
): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
