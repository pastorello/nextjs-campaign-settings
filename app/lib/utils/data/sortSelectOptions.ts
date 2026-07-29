import SelectOption from "../../definitions/types/SelectOption";

// `[...optionList]` matters here, not just style: `optionList` is the same
// array reference as the field's `PageMeta.options` (pageMetaFields.ts holds
// it directly, no copy). `Array.prototype.sort` mutates in place, so without
// the copy this permanently reorders the shared metadata array the first
// time any form renders it — corrupting every other consumer (e.g.
// SelectButtonery's filter buttons) for the rest of the server process, and
// producing a hydration mismatch versus the client's still-original order
// (TD-31: the "1° Livello vs Trucchetto" mismatch was this, not a locale bug).
const sortSelectOptions = (optionList: SelectOption[]) =>
  [...optionList].sort((a, b) => {
    if (a.value === -1) {
      return -1;
    }
    if (b.value === -1) {
      return 1;
    }
    return a.label.localeCompare(b.label);
  });

export default sortSelectOptions;
