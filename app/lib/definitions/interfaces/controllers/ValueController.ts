import { Dispatch, SetStateAction } from "react";
import MetaValue from "../../types/MetaValue";

interface ValueController<T extends MetaValue = MetaValue> {
  setter: Dispatch<SetStateAction<T>>;
  value: T;
}

export default ValueController;
