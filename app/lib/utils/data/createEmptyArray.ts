import Indexable from "@/app/lib/definitions/types/Indexable";
import isValidDataArray from "@/app/lib/utils/validators/isValidDataArray";

const createEmptyArray = <T extends Indexable[] | number[] | string[]>(
  list: T
): T => {
  if (isValidDataArray(list)) {
    // Se l'array non è vuoto, usa il tipo del primo elemento per determinare il tipo di array vuoto
    if (typeof list[0] === "number") {
      return [] as unknown as T;
    } else if (typeof list[0] === "string") {
      return [] as unknown as T;
    } else {
      return [] as unknown as T;
    }
  }
  // Se l'array è vuoto, non possiamo determinare il tipo, quindi usiamo un type assertion
  return [] as unknown as T;
};

export default createEmptyArray;
