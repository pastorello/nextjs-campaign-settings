import { Dispatch, SetStateAction } from "react";
import MetaValue from "./MetaValue";

type MetaSetter = Dispatch<SetStateAction<MetaValue>>;

export default MetaSetter;
