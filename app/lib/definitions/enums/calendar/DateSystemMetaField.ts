/** The date system's scalar fields (SPEC-014 §5.2, §7), keyed as in `dateSystemMeta`. */
enum DateSystemMetaField {
  name = "name",
  anchorEvent = "anchorEvent",
  anchorYear = "anchorYear",
  afterLabel = "afterLabel",
  afterAbbrev = "afterAbbrev",
  beforeLabel = "beforeLabel",
  beforeAbbrev = "beforeAbbrev",
  monthNames = "monthNames",
  weekdayNames = "weekdayNames",
}

export default DateSystemMetaField;
