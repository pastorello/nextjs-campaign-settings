import DateSystemInput from "./DateSystemInput";

/**
 * What the DM may change on the universal count (SPEC-014 §5.2): its names
 * and its "after" labels. Never its anchor — its year 0 is the dawn of
 * time — and it has no years "before".
 */
type UniversalDateSystemInput = Pick<
  DateSystemInput,
  "name" | "afterLabel" | "afterAbbrev" | "monthNames" | "weekdayNames"
>;

export default UniversalDateSystemInput;
