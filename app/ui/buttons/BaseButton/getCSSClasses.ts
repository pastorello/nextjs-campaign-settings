import ButtonSize from "./ButtonSize";
import ButtonVariant from "./ButtonVariant";
import ButtonState from "./ButtonState";

const getCSSClasses = (
  variant: ButtonVariant,
  size: ButtonSize,
  buttonState: ButtonState = ButtonState.Default
) => {
  // An explicit focus ring, replacing the browser default (TD-15).
  //
  // Measured rather than assumed, and the first measurement was wrong: reading
  // the computed style after a programmatic `.focus()` reports
  // `outline-style: none`, because programmatic focus does not match
  // `:focus-visible`. Tabbing there with a real keypress shows the browser's
  // own `outline: auto 1px` — so this is not a missing indicator, it is a thin
  // one that varies by browser and reads poorly on the app's dark surfaces.
  // 2px at an offset, in a fixed colour, is legible on both.
  const baseClasses =
    "flex rounded disabled:bg-stone-400 disabled:cursor-not-allowed " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500";

  // `selected` is the persistent "active/pressed" look for each variant. It
  // mirrors the variant's hover colour so the current choice reads as engaged.
  const colorRules = {
    // violet-600, not 500: axe measured white on violet-500 (#8e51ff) at
    // 4.4:1 against the 4.5:1 WCAG AA needs for 14px text — it missed by a
    // tenth, on every primary button in the app. violet-600 is ~5.9:1 (TD-15).
    primary: {
      base: "text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-900",
      selected: "bg-violet-700",
    },
    secondary: {
      base: "text-black bg-white hover:bg-zinc-600 hover:text-white active:bg-black active:text-white",
      selected: "bg-zinc-600 text-white",
    },
    danger: {
      base: "text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-900",
      selected: "bg-rose-700",
    },
    neutral: {
      base: "text-black bg-white hover:text-sky-600 active:text-sky-700",
      selected: "text-sky-600",
    },
  };

  const sizeRules = {
    small: { sizeClasses: "h-[32px]", styleClasses: "px-1 py-px text-sm" },
    medium: { sizeClasses: "h-[40px]", styleClasses: "px-4 py-[2px] text-sm" },
    large: { sizeClasses: "h-[40px]", styleClasses: "px-4 py-[2px] text-sm" },
    squaredSmall: {
      sizeClasses: "h-[40px] flex-col",
      styleClasses: "px-[2px] py-[2px] text-sm",
    },
  };

  const selectedSizeClasses = Object.hasOwn(sizeRules, size)
    ? sizeRules[size]
    : sizeRules.medium;

  const selectedColorScheme = Object.hasOwn(colorRules, variant)
    ? colorRules[variant]
    : colorRules.primary;

  // The disabled look comes from the `disabled:` variants in `baseClasses`
  // (applied by the `disabled` attribute), so ButtonState.Disabled adds no
  // extra classes here — the component sets the attribute instead.
  const stateRules = {
    [ButtonState.Default]: "",
    [ButtonState.Active]: selectedColorScheme.selected,
    [ButtonState.Loading]: "cursor-wait",
    [ButtonState.Disabled]: "",
  };

  const stateClasses = Object.hasOwn(stateRules, buttonState)
    ? stateRules[buttonState]
    : "";

  const base = `${baseClasses} ${selectedSizeClasses.styleClasses} ${selectedColorScheme.base}`;

  return {
    sizeClasses: selectedSizeClasses.sizeClasses,
    base,
    stateClasses,
  };
};

export default getCSSClasses;
