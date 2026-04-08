import { useLocation } from "react-router-dom";
import BaseButton from "../buttons/BaseButton";
import ButtonState from "../buttons/BaseButton/ButtonState";
import isValidDataArray from "../functions/isValidDataArray";

interface HeaderProps {
  navItems: Array<{ to: string; label: string }>;
  actions?: Array<{ action: () => void; label: string }>;
}

const Header = ({ navItems, actions }: HeaderProps) => {
  const location = useLocation();

  return (
    <header className="mb-8 bg-neutral-700 p-2">
      <nav className="flex gap-2">
        <div className="flex flex-1 gap-2">
          {navItems.map((item) => (
            <BaseButton
              key={item.to}
              to={item.to}
              buttonState={
                location.pathname === item.to
                  ? ButtonState.Active
                  : ButtonState.Default
              }
            >
              {item.label}
            </BaseButton>
          ))}
        </div>
        {isValidDataArray(actions) && (
          <div className="flex flex-1 justify-end gap-2">
            {actions.map((item) => (
              <BaseButton key={item.label} onClick={item.action}>
                {item.label}
              </BaseButton>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
