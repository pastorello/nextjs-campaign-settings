import BaseButton from "./BaseButton";
import IconType from "./BaseButton/IconType";
import ButtonSize from "./BaseButton/ButtonSize";
import ButtonVariant from "./BaseButton/ButtonVariant";
import SortOrder from "@/app/lib/definitions/types/SortOrder";

interface SortButtonProps {
  sortOrder: SortOrder;
  onClick: () => void;
  isActive: boolean;
  /** The column this sorts, so the control can name itself. */
  label: string;
}

const SortButton = ({
  sortOrder,
  onClick,
  isActive,
  label,
}: SortButtonProps) => {
  return (
    <BaseButton
      onClick={onClick}
      icon={
        isActive
          ? sortOrder !== SortOrder.asc
            ? IconType.chevronDown
            : IconType.chevronUp
          : IconType.chevronUpDown
      }
      // Icon-only: without a name a screen reader hears "button" once per
      // column heading and nothing more (TD-15).
      ariaLabel={`Ordina per ${label.toLowerCase()}`}
      size={ButtonSize.small}
      variant={ButtonVariant.neutral}
    />
  );
};

export default SortButton;
