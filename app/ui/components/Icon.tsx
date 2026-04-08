//made with https://heroicons.com/
import { ReactNode } from "react";
import ButtonSize from "../buttons/BaseButton/ButtonSize";
import IconType from "../buttons/BaseButton/IconType";
import isValidString from "@/app/lib/utils/validators/isValidString";

const availableIcons = {
  checked: (
    <path
      d="M3 8L6 11L11 3.5"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  search: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  ),
  questionMark: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
    />
  ),
  chevronUpDown: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
    />
  ),
  chevronDown: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m19.5 8.25-7.5 7.5-7.5-7.5"
    />
  ),

  chevronUp: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 15.75 7.5-7.5 7.5 7.5"
    />
  ),
};

const sizeClasses = {
  [ButtonSize.large]: "size-7",
  [ButtonSize.medium]: "size-7",
  [ButtonSize.small]: "size-6",
  [ButtonSize.squaredSmall]: "size-7",
};

interface IconProps {
  iconType: IconType;
  className?: string;
  size?: ButtonSize;
}

const Icon = ({
  iconType,
  className,
  size = ButtonSize.medium,
}: IconProps): ReactNode => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`${sizeClasses[size]} ${
        isValidString(className) ? className : ""
      }`}
    >
      {
        availableIcons[
          Object.hasOwn(availableIcons, iconType) ? iconType : "questionMark"
        ]
      }
    </svg>
  );
};

export default Icon;
