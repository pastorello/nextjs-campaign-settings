/**
 * One way the world counts years (SPEC-014 §5.2), as the UI reads it — the
 * `dateSystem` row without its timestamps. Month and weekday names are the
 * DM's own content, shown as written and never translated; only the year
 * differs between systems (ADR-0015).
 */
interface DateSystem {
  id: number;
  /** The built-in universal count; exactly one row, never deleted. */
  isUniversal: boolean;
  /** The world's default system; exactly one row. */
  isDefault: boolean;
  name: string;
  /** `null` for the universal count, which has no anchor event. */
  anchorEvent: string | null;
  /** The anchor event's universal year; 0 for the universal count. */
  anchorYear: number;
  afterLabel: string;
  afterAbbrev: string;
  /** `null` for the universal count, which has no years "before". */
  beforeLabel: string | null;
  beforeAbbrev: string | null;
  /** Exactly 12 (a CHECK in the migration). */
  monthNames: string[];
  /** Exactly 7 (a CHECK in the migration). */
  weekdayNames: string[];
}

export default DateSystem;
