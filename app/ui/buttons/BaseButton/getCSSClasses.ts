import ButtonSize from "./ButtonSize";
import ButtonVariant from "./ButtonVariant";
import ButtonState from "./ButtonState";

const getCSSClasses = (
  variant: ButtonVariant,
  size: ButtonSize,
  buttonState: ButtonState = ButtonState.Flat
) => {
  const baseClasses =
    "flex rounded disabled:bg-stone-400 disabled:cursor-not-allowed";

  // `selected` is the persistent "active/pressed" look for each variant. It
  // mirrors the variant's hover colour so the current choice reads as engaged.
  const colorRules = {
    primary: {
      base: "text-white bg-violet-500 hover:bg-violet-700 active:bg-violet-900",
      selected: "bg-violet-700",
    },
    secondary: {
      base: "text-black bg-white hover:bg-zinc-600 hover:text-white active:bg-black active:text-white",
      selected: "bg-zinc-600 text-white",
    },
    danger: {
      base: "text-white bg-rose-500 hover:bg-rose-700 active:bg-rose-900",
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
    [ButtonState.Flat]: "",
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
