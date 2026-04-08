import PrimitiveValue from "../../types/PrimitiveValue";

interface FieldHandler {
  setter: (value: PrimitiveValue | number[] | string[]) => void;
  value: PrimitiveValue | number[] | string[];
}

export default FieldHandler;
