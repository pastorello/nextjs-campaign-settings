/**
 * A domain's colour (SPEC-021 T2), stored as `dhDomain.colour`: a palette
 * key, never free hex, so every colour the app can show is one whose band
 * classes were checked for contrast. The classes live in
 * `app/lib/config/daggerheart/dhDomainColours.ts`.
 */
enum DhDomainColour {
  Crimson = "crimson",
  Rose = "rose",
  Amber = "amber",
  Emerald = "emerald",
  Teal = "teal",
  Sky = "sky",
  Indigo = "indigo",
  Violet = "violet",
  Slate = "slate",
  Stone = "stone",
}

export default DhDomainColour;
