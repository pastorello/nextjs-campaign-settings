/**
 * Where an event sits against a campaign's "today" (SPEC-014 §5.5): ended
 * before it, spanning it, or still to come. A yearly event is judged by its
 * occurrence on or after today, so it is never past (§5.4).
 */
type EventTiming = "past" | "current" | "upcoming";

export default EventTiming;
