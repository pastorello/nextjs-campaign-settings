"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@headlessui/react";
import clsx from "clsx";

import Icon from "../../components/Icon";
import getCSSClasses from "./getCSSClasses";
import ButtonVariant from "./ButtonVariant";
import ButtonSize from "./ButtonSize";
import IconType from "./IconType";
import ButtonState from "./ButtonState";
import isValidFunction from "@/app/lib/utils/validators/isValidFunction";
import isValidString from "@/app/lib/utils/validators/isValidString";

interface BaseButtonProps {
  children?: ReactNode;
  onClick?: Function;
  className?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: IconType;
  size?: ButtonSize;
  to?: string;
  buttonState?: ButtonState;
  type?: "submit";
}

const BaseButton = ({
  children,
  onClick,
  className,
  variant = ButtonVariant.primary,
  disabled = false,
  icon,
  size = ButtonSize.medium,
  to,
  buttonState = ButtonState.Default,
}: BaseButtonProps) => {
  const { sizeClasses, selectedColorScheme } = getCSSClasses(variant, size);

  const theButton = (
    <>
      {children && (
        <div
          className={clsx(
            sizeClasses,
            "flex flex-1 items-center justify-center truncate px-[5px]"
          )}
        >
          {children}
        </div>
      )}
      {isValidString(icon) && (
        <div
          className={clsx(sizeClasses, "flex w-[28px] items-center px-[5px]")}
        >
          <Icon iconType={icon} />
        </div>
      )}
    </>
  );

  if (isValidString(to)) {
    return (
      <Link className={clsx(selectedColorScheme.base, className)} href={to}>
        {theButton}
      </Link>
    );
  }

  if (onClick) {
    const submitAction = () => {
      if (isValidFunction(onClick)) {
        onClick();
      }
    };

    return (
      <Button
        onClick={submitAction}
        className={clsx(selectedColorScheme.base, className)}
        disabled={disabled}
      >
        {theButton}
      </Button>
    );
  } else {
    return (
      <Button
        type="submit"
        className={clsx(selectedColorScheme.base, className)}
        disabled={disabled}
      >
        {theButton}
      </Button>
    );
  }
};

export default BaseButton;
