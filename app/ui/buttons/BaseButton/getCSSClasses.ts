import ButtonSize from "./ButtonSize";
import ButtonVariant from "./ButtonVariant";

const getCSSClasses = (variant: ButtonVariant, size: ButtonSize) => {
  const baseClasses =
    "flex rounded disabled:bg-stone-400 disabled:cursor-not-allowed";

  const colorRules = {
    primary: {
      base: "text-white bg-violet-500 hover:bg-violet-700 active:bg-violet-900",
    },
    secondary: {
      base: "text-black bg-white hover:bg-zinc-600 hover:text-white active:bg-black active:text-white",
    },
    danger: {
      base: "text-white bg-rose-500 hover:bg-rose-700 active:bg-rose-900",
    },
    neutral: {
      base: "text-black bg-white hover:text-sky-600 active:text-sky-700",
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

  selectedColorScheme.base = `${baseClasses} ${selectedSizeClasses.styleClasses} ${selectedColorScheme.base}`;

  return { sizeClasses: selectedSizeClasses.sizeClasses, selectedColorScheme };
};

export default getCSSClasses;
