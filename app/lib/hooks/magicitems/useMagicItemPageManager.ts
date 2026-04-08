"use client";

import { useState } from "react";

import ListItem from "../../definitions/interfaces/ListItem";
import MagicItemMetaField from "../../definitions/enums/magicitem/MagicItemMetaField";
import MagicItem from "../../definitions/interfaces/magicitem/MagicItem";

import pageMetaFields from "../../config/pageMetaFields";

import isValidDataObject from "../../utils/validators/isValidDataObject";
import usePageManager from "../usePageManager";
import ValueController from "../../definitions/interfaces/controllers/ValueController";
import MetaConfigKey from "../../definitions/types/MetaConfigKey";
import MetaValue from "../../definitions/types/MetaValue";

interface PageManagerProps {
  magicItem?: MagicItem;
}

const useMagicItemPageManager = ({ magicItem }: PageManagerProps): ListItem => {
  const isCreateMode = !isValidDataObject(magicItem);

  const getDefaultValue = (aMeta: MagicItemMetaField): MetaValue => {
    if (isCreateMode) {
      return pageMetaFields[aMeta].defaultValue;
    } else {
      return magicItem[aMeta];
    }
  };

  const [nome, setNome] = useState(getDefaultValue(MagicItemMetaField.nome));
  const [rarita, setRarita] = useState(
    getDefaultValue(MagicItemMetaField.rarita)
  );
  const [tipo, setTipo] = useState(getDefaultValue(MagicItemMetaField.tipo));
  const [sintonia, setSintonia] = useState(
    getDefaultValue(MagicItemMetaField.sintonia)
  );
  const [descrizione, setDescrizione] = useState(
    getDefaultValue(MagicItemMetaField.descrizione)
  );

  const itemFields: Record<MetaConfigKey, ValueController> = {
    [MagicItemMetaField.nome]: { setter: setNome, value: nome },
    [MagicItemMetaField.rarita]: { setter: setRarita, value: rarita },
    [MagicItemMetaField.tipo]: { setter: setTipo, value: tipo },
    [MagicItemMetaField.sintonia]: {
      setter: setSintonia,
      value: sintonia,
    },
    [MagicItemMetaField.descrizione]: {
      setter: setDescrizione,
      value: descrizione,
    },
  };

  const { page, setField, getField } = usePageManager(itemFields);

  if (!isCreateMode) {
    page.id = magicItem.id;
  }

  const editedFields = Object.keys(itemFields).reduce((acc, key) => {
    const typedKey = key as MagicItemMetaField;
    if (itemFields[typedKey].value !== getDefaultValue(typedKey)) {
      acc.push(typedKey);
    }
    return acc;
  }, [] as MagicItemMetaField[]);

  return {
    editedFields,
    page,
    setField,
    getField,
  };
};

export default useMagicItemPageManager;
