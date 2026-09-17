import { describe, expect, it, vi } from "vitest";
import type { LeafletKeyboardEvent } from "leaflet";

import {
  isActivationKey,
  makeKeyboardActivatable,
  type KeyboardActivatableLayer,
} from "./keyboardActivation";

function fakeLayer(element: Element | undefined) {
  let keydown: ((event: LeafletKeyboardEvent) => void) | undefined;
  const layer: KeyboardActivatableLayer = {
    getElement: () => element,
    on: (_type, fn) => {
      keydown = fn;
    },
  };
  const press = (key: string) => {
    const originalEvent = new KeyboardEvent("keydown", {
      key,
      cancelable: true,
    });
    keydown?.({ originalEvent } as LeafletKeyboardEvent);
    return originalEvent;
  };
  return { layer, press };
}

describe("isActivationKey", () => {
  it.each([
    ["Enter", true],
    [" ", true],
    ["Tab", false],
    ["Escape", false],
    ["a", false],
  ])("%j → %s", (key, expected) => {
    expect(isActivationKey({ key })).toBe(expected);
  });
});

describe("makeKeyboardActivatable", () => {
  it("names the element and makes an unfocusable one a focusable button", () => {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    const { layer } = fakeLayer(element);

    makeKeyboardActivatable(layer, "Regno di Kang", vi.fn());

    expect(element.getAttribute("aria-label")).toBe("Regno di Kang");
    expect(element.getAttribute("tabindex")).toBe("0");
    expect(element.getAttribute("role")).toBe("button");
  });

  it("leaves attributes Leaflet already set alone", () => {
    const element = document.createElement("div");
    element.setAttribute("tabindex", "-1");
    element.setAttribute("role", "img");
    const { layer } = fakeLayer(element);

    makeKeyboardActivatable(layer, "Torre", vi.fn());

    expect(element.getAttribute("tabindex")).toBe("-1");
    expect(element.getAttribute("role")).toBe("img");
  });

  it.each(["Enter", " "])(
    "runs the callback and prevents the default on %j",
    (key) => {
      const onActivate = vi.fn();
      const { layer, press } = fakeLayer(document.createElement("div"));
      makeKeyboardActivatable(layer, "Torre", onActivate);

      const event = press(key);

      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    }
  );

  it("ignores other keys, so arrow-key panning still reaches the map", () => {
    const onActivate = vi.fn();
    const { layer, press } = fakeLayer(document.createElement("div"));
    makeKeyboardActivatable(layer, "Torre", onActivate);

    const event = press("ArrowLeft");

    expect(onActivate).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("still wires the key handler when the element is not rendered yet", () => {
    const onActivate = vi.fn();
    const { layer, press } = fakeLayer(undefined);

    makeKeyboardActivatable(layer, "Torre", onActivate);
    press("Enter");

    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
