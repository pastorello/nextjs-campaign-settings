enum ButtonVariant {
  primary = "primary",
  secondary = "secondary",
  danger = "danger",
  neutral = "neutral",

  /**
   * Secondary at rest, danger-coloured only on hover/active (TD-118). For a
   * row action that needs the destructive colour to read as a warning on
   * interaction rather than compete with the rest of the row at rest — the
   * admin list's icon-only delete button is the only caller today.
   */
  ghostDanger = "ghostDanger",
}

export default ButtonVariant;
