/**
 * The six kinds a scene can be (SPEC-013 §6). Stored directly as
 * `scene.kind`'s raw `String` value — unlike `MagicItemType`/`Rarity`, there
 * is no separate numeric options array remapping this enum to an `Int`
 * column, because the column itself is a `String` and these values are
 * exactly what gets written to it.
 */
enum SceneKind {
  Fight = "fight",
  Explore = "explore",
  Clue = "clue",
  Goal = "goal",
  Dungeon = "dungeon",
  Break = "break",
}

export default SceneKind;
