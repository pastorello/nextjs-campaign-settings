const MAX_SLUG_LENGTH = 80;

/**
 * A record's name as a file name for an export (SPEC-033): lowercase ASCII
 * letters and digits joined by dashes, accents dropped ("Città" → "citta"),
 * at most eighty characters. A name with nothing left — all symbols, or a
 * script with no Latin letters — falls back to `fallback`.
 */
export default function slugify(text: string, fallback: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
  return slug === "" ? fallback : slug;
}
