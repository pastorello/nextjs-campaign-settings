import PrimitiveValue from "./PrimitiveValue";

type Indexable = Record<
  string,
  PrimitiveValue | number[] | string[] | undefined
>;

export default Indexable;
