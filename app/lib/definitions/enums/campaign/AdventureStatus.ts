/**
 * The three states an adventure moves through (SPEC-013 §6). Stored
 * directly as `adventure.status`'s raw `String` value — same reasoning as
 * `SceneKind`: the column is a `String`, not an `Int`, so this enum's values
 * are what gets written to it, with no numeric options array in between.
 */
enum AdventureStatus {
  Planned = "planned",
  Active = "active",
  Completed = "completed",
}

export default AdventureStatus;
