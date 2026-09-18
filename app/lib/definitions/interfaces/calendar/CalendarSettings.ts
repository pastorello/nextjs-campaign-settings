/**
 * The world's calendar settings, a singleton row (SPEC-014 §6). With no
 * reference new moon set, no moon phase is shown anywhere (§5.3).
 */
interface CalendarSettings {
  /** A universal day; `null` = no moon phases shown. */
  moonNewMoonDay: number | null;
}

export default CalendarSettings;
