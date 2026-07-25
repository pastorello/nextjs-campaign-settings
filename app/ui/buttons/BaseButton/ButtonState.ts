enum ButtonState {
  // No particular state — renders the plain variant look and stays interactive.
  Default = "default",
  // Non-interactive; shows an inline spinner.
  Loading = "loading",
  // Persistent "selected" look (e.g. the current choice in a SelectButtonery).
  Active = "active",
  // Non-interactive; renders the disabled look.
  Disabled = "disabled",
}

export default ButtonState;
