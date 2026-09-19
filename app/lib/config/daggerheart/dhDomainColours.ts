import DhDomainColour from "@/app/lib/definitions/enums/daggerheart/DhDomainColour";

export interface DhDomainColourObject {
  value: DhDomainColour;
  labelKey: string;
  /**
   * The card view's colour band: a background and the text drawn on it.
   * Every pair here has at least 4.5:1 contrast (WCAG AA for normal text).
   */
  bandClass: string;
  /** The card's outline, in the same hue as the band. */
  borderClass: string;
}

/**
 * The domain colour palette (SPEC-021 T2). A domain stores one of these keys,
 * never a free colour, so the band a card view draws is always one whose
 * text contrast was checked. White text on each shade's 700 step (800 for
 * amber, whose 700 sits too close to the floor), contrast against Tailwind's
 * palette as measured when the palette was chosen:
 *
 * | key     | band         | white text |
 * | ------- | ------------ | ---------- |
 * | crimson | `red-700`    | ≈ 6.5:1    |
 * | rose    | `rose-700`   | ≈ 6.0:1    |
 * | amber   | `amber-800`  | ≈ 7.0:1    |
 * | emerald | `emerald-700`| ≈ 5.5:1    |
 * | teal    | `teal-700`   | ≈ 5.5:1    |
 * | sky     | `sky-700`    | ≈ 5.9:1    |
 * | indigo  | `indigo-700` | ≈ 7.9:1    |
 * | violet  | `violet-700` | ≈ 7.1:1    |
 * | slate   | `slate-700`  | ≈ 10.3:1   |
 * | stone   | `stone-700`  | ≈ 10.1:1   |
 *
 * Adding a colour means adding a shade that clears 4.5:1 with its text —
 * check it before adding it, and add the enum member with it. The classes
 * are written out in full so Tailwind's scanner finds them.
 */
const dhDomainColours: DhDomainColourObject[] = [
  {
    value: DhDomainColour.Crimson,
    labelKey: "dhDomains.colours.crimson",
    bandClass: "bg-red-700 text-white",
    borderClass: "border-red-700",
  },
  {
    value: DhDomainColour.Rose,
    labelKey: "dhDomains.colours.rose",
    bandClass: "bg-rose-700 text-white",
    borderClass: "border-rose-700",
  },
  {
    value: DhDomainColour.Amber,
    labelKey: "dhDomains.colours.amber",
    bandClass: "bg-amber-800 text-white",
    borderClass: "border-amber-800",
  },
  {
    value: DhDomainColour.Emerald,
    labelKey: "dhDomains.colours.emerald",
    bandClass: "bg-emerald-700 text-white",
    borderClass: "border-emerald-700",
  },
  {
    value: DhDomainColour.Teal,
    labelKey: "dhDomains.colours.teal",
    bandClass: "bg-teal-700 text-white",
    borderClass: "border-teal-700",
  },
  {
    value: DhDomainColour.Sky,
    labelKey: "dhDomains.colours.sky",
    bandClass: "bg-sky-700 text-white",
    borderClass: "border-sky-700",
  },
  {
    value: DhDomainColour.Indigo,
    labelKey: "dhDomains.colours.indigo",
    bandClass: "bg-indigo-700 text-white",
    borderClass: "border-indigo-700",
  },
  {
    value: DhDomainColour.Violet,
    labelKey: "dhDomains.colours.violet",
    bandClass: "bg-violet-700 text-white",
    borderClass: "border-violet-700",
  },
  {
    value: DhDomainColour.Slate,
    labelKey: "dhDomains.colours.slate",
    bandClass: "bg-slate-700 text-white",
    borderClass: "border-slate-700",
  },
  {
    value: DhDomainColour.Stone,
    labelKey: "dhDomains.colours.stone",
    bandClass: "bg-stone-700 text-white",
    borderClass: "border-stone-700",
  },
];

/**
 * A stored colour's palette entry. A key no longer in the palette (a row
 * written before a colour was removed) falls back to the first entry rather
 * than drawing a band with no classes.
 */
export function dhDomainColourOf(colour: string): DhDomainColourObject {
  return (
    dhDomainColours.find(
      (entry) => entry.value === (colour as DhDomainColour)
    ) ?? dhDomainColours[0]!
  );
}

export default dhDomainColours;
