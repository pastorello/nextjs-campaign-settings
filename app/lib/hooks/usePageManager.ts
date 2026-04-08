import { sendErrorNotification } from "../actions/notifications/sendNotification";
import ValueController from "../definitions/interfaces/controllers/ValueController";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import MetaValue from "../definitions/types/MetaValue";

const usePageManager = (
  fieldsController: Record<MetaConfigKey, ValueController>
) => {
  const setField = (field: MetaConfigKey, value: MetaValue) => {
    const fieldSetter = fieldsController[field]?.setter;
    if (fieldSetter) {
      fieldSetter(value);
    } else {
      sendErrorNotification(`No setter found for field: ${field}`);
    }
  };

  const getField = (field: MetaConfigKey): MetaValue => {
    const fieldValue = fieldsController[field]?.value;
    if (fieldValue === undefined) {
      throw new Error(`No value found for field: ${field}`);
    }
    return fieldValue;
  };

  const page = Object.fromEntries(
    Object.entries(fieldsController).map(([chiave, oggetto]) => [
      chiave,
      oggetto.value,
    ])
  );

  return {
    page,
    setField,
    getField,
  };
};

export default usePageManager;
