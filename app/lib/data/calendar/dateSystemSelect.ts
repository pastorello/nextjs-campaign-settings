/**
 * The `dateSystem` columns the UI reads — every one but the timestamps.
 * Shared by `fetchDateSystems` and `fetchDefaultDateSystem` so the two
 * cannot drift from `DateSystem`, which this shape matches field for field.
 */
const dateSystemSelect = {
  id: true,
  isUniversal: true,
  isDefault: true,
  name: true,
  anchorEvent: true,
  anchorYear: true,
  afterLabel: true,
  afterAbbrev: true,
  beforeLabel: true,
  beforeAbbrev: true,
  monthNames: true,
  weekdayNames: true,
} as const;

export default dateSystemSelect;
