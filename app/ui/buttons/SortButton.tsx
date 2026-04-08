import BaseButton from "./BaseButton";
import IconType from "./BaseButton/IconType";
import ButtonSize from "./BaseButton/ButtonSize";
import ButtonVariant from "./BaseButton/ButtonVariant";
import SortOrder from "@/app/lib/definitions/types/SortOrder";

interface SortButtonProps {
  sortOrder: string;
  onClick: () => void;
  isActive: boolean;
}

const SortButton = ({ sortOrder, onClick, isActive }: SortButtonProps) => {
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
      size={ButtonSize.small}
      variant={ButtonVariant.neutral}
    />
  );
};

export default SortButton;
