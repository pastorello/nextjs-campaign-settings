"use client";

import { useState } from "react";

import ListItem from "../../definitions/interfaces/ListItem";
import MagicItemMetaField from "../../definitions/enums/magicitem/MagicItemMetaField";
import pageMetaFields from "../../config/pageMetaFields";

import isValidDataObject from "../../utils/validators/isValidDataObject";
import usePageManager from "../usePageManager";
import ValueController from "../../definitions/interfaces/controllers/ValueController";
import MetaConfigKey from "../../definitions/types/MetaConfigKey";
import MetaValue from "../../definitions/types/MetaValue";
import PngMetaField from "../../definitions/enums/png/PngMetaField";
import PngItem from "../../definitions/interfaces/png/PngItem";

interface PageManagerProps {
  pageItem?: PngItem;
}

const usePngPageManager = ({ pageItem }: PageManagerProps): ListItem => {
  const isCreateMode = !isValidDataObject(pageItem);

  const getDefaultValue = (aMeta: PngMetaField): MetaValue => {
    if (isCreateMode) {
      return pageMetaFields[aMeta].defaultValue;
    } else {
      return pageItem[aMeta];
    }
  };

  const [nome, setNome] = useState(getDefaultValue(PngMetaField.nome));
  const [descrizione, setDescrizione] = useState(
    getDefaultValue(PngMetaField.descrizione)
  );
  const [allineamento, setAllineamento] = useState(
    getDefaultValue(PngMetaField.allineamento)
  );
  const [aspetto, setAspetto] = useState(getDefaultValue(PngMetaField.aspetto));
  const [dominioAllineamento, setDominioAllineamento] = useState(
    getDefaultValue(PngMetaField.dominioAllineamento)
  );
  const [fazione, setFazione] = useState(getDefaultValue(PngMetaField.fazione));
  const [luogo, setLuogo] = useState(getDefaultValue(PngMetaField.luogo));
  const [mansione, setmansione] = useState(
    getDefaultValue(PngMetaField.mansione)
  );
  const [motivazioni, setmotivazioni] = useState(
    getDefaultValue(PngMetaField.motivazioni)
  );
  const [personalita, setpersonalita] = useState(
    getDefaultValue(PngMetaField.personalita)
  );
  const [segreti, setsegreti] = useState(getDefaultValue(PngMetaField.segreti));
  const [titolo, settitolo] = useState(getDefaultValue(PngMetaField.titolo));

  const itemFields: Record<MetaConfigKey, ValueController> = {
    [MagicItemMetaField.nome]: { setter: setNome, value: nome },
    [MagicItemMetaField.descrizione]: {
      setter: setDescrizione,
      value: descrizione,
    },
    [PngMetaField.allineamento]: {
      setter: setAllineamento,
      value: allineamento,
    },
    [PngMetaField.aspetto]: { setter: setAspetto, value: aspetto },
    [PngMetaField.dominioAllineamento]: {
      setter: setDominioAllineamento,
      value: dominioAllineamento,
    },
    [PngMetaField.fazione]: { setter: setFazione, value: fazione },
    [PngMetaField.luogo]: { setter: setLuogo, value: luogo },
    [PngMetaField.mansione]: { setter: setmansione, value: mansione },
    [PngMetaField.motivazioni]: { setter: setmotivazioni, value: motivazioni },
    [PngMetaField.personalita]: { setter: setpersonalita, value: personalita },
    [PngMetaField.segreti]: { setter: setsegreti, value: segreti },
    [PngMetaField.titolo]: { setter: settitolo, value: titolo },
  };

  const { page, setField, getField } = usePageManager(itemFields);

  if (!isCreateMode) {
    page.id = pageItem.id;
  }

  const editedFields = Object.keys(itemFields).reduce((acc, key) => {
    const typedKey = key as PngMetaField;
    if (itemFields[typedKey].value !== getDefaultValue(typedKey)) {
      acc.push(typedKey);
    }
    return acc;
  }, [] as PngMetaField[]);

  return {
    editedFields,
    page,
    setField,
    getField,
  };
};

export default usePngPageManager;
