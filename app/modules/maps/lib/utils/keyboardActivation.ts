import type { LeafletKeyboardEventHandlerFn } from "leaflet";

/**
 * Keyboard activation for map layers (TD-133, WCAG 2.1.1).
 *
 * Leaflet 1.9 already makes a *marker* Tab-reachable: its `keyboard` option
 * (default `true`) gives the icon element `tabindex="0"` and `role="button"`.
 * What it does not do is name the icon or act on it — its docs say "clicked by
 * pressing enter", but the only listener for that is `bindPopup`'s own
 * `keypress`, and the map's markers deliberately have no bound popup (they
 * open `PlacePopover` from their `click` handler instead). A rectangle
 * (SPEC-009 area) is an SVG path and gets neither.
 *
 * So this fills exactly those gaps: an accessible name, focusability where
 * Leaflet left none, and Enter/Space running the same callback a click does.
 * The key listener goes through Leaflet's own event dispatch (the map
 * container forwards `keydown` to the layer whose element has focus), not a
 * second DOM listener on the element.
 */

/** Enter and Space activate a `role="button"`, as they do a native button. */
export function isActivationKey(event: Pick<KeyboardEvent, "key">): boolean {
  return event.key === "Enter" || event.key === " ";
}

/**
 * The slice of a Leaflet layer this needs — `Marker` and `Rectangle` both fit.
 * Kept structural so a test can hand in a plain object.
 */
export interface KeyboardActivatableLayer {
  getElement(): Element | undefined;
  on(type: "keydown", fn: LeafletKeyboardEventHandlerFn): unknown;
}

/**
 * Name `layer`'s element `label` and run `onActivate` on Enter/Space.
 *
 * Call it after the layer is on the map — before `addTo`, `getElement()` is
 * still `undefined`. `tabindex`/`role` are only added where Leaflet has not
 * already set them, so a marker's own attributes are left alone.
 */
export function makeKeyboardActivatable(
  layer: KeyboardActivatableLayer,
  label: string,
  onActivate: () => void
): void {
  const element = layer.getElement();
  if (element) {
    if (!element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "0");
    }
    if (!element.hasAttribute("role")) {
      element.setAttribute("role", "button");
    }
    element.setAttribute("aria-label", label);
  }

  layer.on("keydown", (event) => {
    if (!isActivationKey(event.originalEvent)) return;
    // Space would otherwise scroll the page; Enter has no default here, but
    // stopping both keeps the two keys identical.
    event.originalEvent.preventDefault();
    onActivate();
  });
}
