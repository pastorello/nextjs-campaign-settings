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

// Small inline spinner for the loading state. Kept local and dependency-free
// (Tailwind's `animate-spin`); the app-level <Spinner> is a full-page loader.
const ButtonSpinner = () => (
  <svg
    className="size-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const BaseButton = ({
  children,
  onClick,
  className,
  variant = ButtonVariant.primary,
  disabled = false,
  icon,
  size = ButtonSize.medium,
  to,
  buttonState = ButtonState.Flat,
}: BaseButtonProps) => {
  const isLoading = buttonState === ButtonState.Loading;
  // The `disabled` prop and ButtonState.Disabled are two doors to the same
  // state; loading is non-interactive too. Reconcile them into one flag.
  const isDisabled = disabled || buttonState === ButtonState.Disabled;
  const isNonInteractive = isDisabled || isLoading;

  const { sizeClasses, base, stateClasses } = getCSSClasses(
    variant,
    size,
    buttonState
  );

  const buttonClasses = clsx(base, stateClasses, className);

  const theButton = (
    <>
      {isLoading && (
        <div
          className={clsx(
            sizeClasses,
            "flex items-center justify-center px-[5px]"
          )}
        >
          <ButtonSpinner />
        </div>
      )}
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
      {!isLoading && isValidString(icon) && (
        <div
          className={clsx(sizeClasses, "flex w-[28px] items-center px-[5px]")}
        >
          <Icon iconType={icon} />
        </div>
      )}
    </>
  );

  if (isValidString(to)) {
    // Links have no `disabled` attribute; approximate it so a non-interactive
    // link cannot be followed or focused.
    return (
      <Link
        className={clsx(buttonClasses, {
          "pointer-events-none opacity-60": isNonInteractive,
        })}
        href={to}
        aria-disabled={isNonInteractive || undefined}
        tabIndex={isNonInteractive ? -1 : undefined}
      >
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
        className={buttonClasses}
        disabled={isNonInteractive}
      >
        {theButton}
      </Button>
    );
  } else {
    return (
      <Button
        type="submit"
        className={buttonClasses}
        disabled={isNonInteractive}
      >
        {theButton}
      </Button>
    );
  }
};

export default BaseButton;
