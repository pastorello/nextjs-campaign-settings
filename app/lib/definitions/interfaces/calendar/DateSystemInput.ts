/**
 * What the date systems panel submits to create or edit one of the DM's own
 * systems (SPEC-014 §5.2) — a `DateSystem` without its id and flags, and
 * with every label required: only the universal count goes without an
 * anchor or a "before". `isDefault` has its own action
 * (`setDefaultDateSystem`), so exactly one row keeps it.
 */
interface DateSystemInput {
  name: string;
  anchorEvent: string;
  anchorYear: number;
  afterLabel: string;
  afterAbbrev: string;
  beforeLabel: string;
  beforeAbbrev: string;
  monthNames: string[];
  weekdayNames: string[];
}

export default DateSystemInput;
