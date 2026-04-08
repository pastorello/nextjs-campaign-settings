"use client";

import { useState } from "react";

import ListItem from "../../definitions/interfaces/ListItem";
import pageMetaFields from "../../config/pageMetaFields";

import isValidDataObject from "../../utils/validators/isValidDataObject";
import usePageManager from "../usePageManager";
import MetaValue from "../../definitions/types/MetaValue";
import SpellMetaField from "../../definitions/enums/spells/SpellMetaField";
import Spell from "../../definitions/interfaces/spells/Spell";
import MetaConfigKey from "../../definitions/types/MetaConfigKey";
import ValueController from "../../definitions/interfaces/controllers/ValueController";

interface PageManagerProps {
  pageItem?: Spell;
}

const useSpellPageManager = ({ pageItem }: PageManagerProps): ListItem => {
  const isCreateMode = !isValidDataObject(pageItem);

  const getDefaultValue = (aMeta: SpellMetaField): MetaValue => {
    if (isCreateMode) {
      return pageMetaFields[aMeta].defaultValue;
    } else {
      return pageItem[aMeta];
    }
  };

  const [title, setTitle] = useState(getDefaultValue(SpellMetaField.nome));
  const [livello, setLivello] = useState(
    getDefaultValue(SpellMetaField.livello)
  );
  const [circolo, setCircolo] = useState(
    getDefaultValue(SpellMetaField.circolo)
  );
  const [classi, setClassi] = useState(getDefaultValue(SpellMetaField.classi));
  const [tempoDiLancio, setTempoDiLancio] = useState(
    getDefaultValue(SpellMetaField.tempoDiLancio)
  );
  const [gittata, setGittata] = useState(
    getDefaultValue(SpellMetaField.gittata)
  );
  const [componenti, setComponenti] = useState(
    getDefaultValue(SpellMetaField.componenti)
  );
  const [durata, setDurata] = useState(getDefaultValue(SpellMetaField.durata));
  const [rituale, setRituale] = useState(
    getDefaultValue(SpellMetaField.rituale)
  );
  const [descrizione, setDescrizione] = useState(
    getDefaultValue(SpellMetaField.descrizione)
  );
  const [intensificato, setIntensificato] = useState(
    getDefaultValue(SpellMetaField.intensificato)
  );

  const itemFields: Record<MetaConfigKey, ValueController> = {
    [SpellMetaField.sottoClassi]: { setter: setCircolo, value: circolo },
    [SpellMetaField.circolo]: { setter: setCircolo, value: circolo },
    [SpellMetaField.classi]: { setter: setClassi, value: classi },
    [SpellMetaField.componenti]: { setter: setComponenti, value: componenti },
    [SpellMetaField.descrizione]: {
      setter: setDescrizione,
      value: descrizione,
    },
    [SpellMetaField.durata]: { setter: setDurata, value: durata },
    [SpellMetaField.gittata]: { setter: setGittata, value: gittata },
    [SpellMetaField.intensificato]: {
      setter: setIntensificato,
      value: intensificato,
    },
    [SpellMetaField.livello]: { setter: setLivello, value: livello },
    [SpellMetaField.nome]: { setter: setTitle, value: title },
    [SpellMetaField.rituale]: { setter: setRituale, value: rituale },
    [SpellMetaField.tempoDiLancio]: {
      setter: setTempoDiLancio,
      value: tempoDiLancio,
    },
  };

  const { page, setField, getField } = usePageManager(itemFields);

  if (!isCreateMode) {
    page.id = pageItem.id;
  }

  const editedFields = Object.keys(itemFields).reduce((acc, key) => {
    const typedKey = key as SpellMetaField;
    if (itemFields[typedKey].value !== getDefaultValue(typedKey)) {
      acc.push(typedKey);
    }
    return acc;
  }, [] as SpellMetaField[]);

  return {
    editedFields,
    page,
    setField,
    getField,
  };
};

export default useSpellPageManager;
