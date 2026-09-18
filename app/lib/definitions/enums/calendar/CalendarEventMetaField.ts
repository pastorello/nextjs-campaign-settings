/**
 * `calendarEvent`'s scalar form fields (SPEC-014 §6/§7), shared by world
 * history (T5) and campaign events (T6). The owner columns (`campaignId`,
 * `adventureId`, `sceneId`) and world history's links are deliberately
 * absent: each kind of event adds its own on top of these.
 */
enum CalendarEventMetaField {
  title = "title",
  description = "description",
  startDay = "startDay",
  startHour = "startHour",
  endDay = "endDay",
  endHour = "endHour",
  repeatsYearly = "repeatsYearly",
}

export default CalendarEventMetaField;
