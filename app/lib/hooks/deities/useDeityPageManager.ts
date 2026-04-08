"use client";

import { useState } from "react";

import ListItem from "../../definitions/interfaces/ListItem";
import pageMetaFields from "../../config/pageMetaFields";

import isValidDataObject from "../../utils/validators/isValidDataObject";
import usePageManager from "../usePageManager";
import MetaValue from "../../definitions/types/MetaValue";
import MetaConfigKey from "../../definitions/types/MetaConfigKey";
import ValueController from "../../definitions/interfaces/controllers/ValueController";
import PatronoMetaField from "../../definitions/enums/deities/PatronoMetaField";
import Patrono from "../../definitions/interfaces/deities/Patrono";

interface PageManagerProps {
  pageItem?: Patrono;
}

const useDeityPageManager = ({ pageItem }: PageManagerProps): ListItem => {
  const isCreateMode = !isValidDataObject(pageItem);

  const getDefaultValue = (aMeta: PatronoMetaField): MetaValue => {
    if (isCreateMode) {
      return pageMetaFields[aMeta].defaultValue;
    } else {
      return pageItem[aMeta];
    }
  };

  const [nome, setnome] = useState(getDefaultValue(PatronoMetaField.nome));
  const [titoloPatrono, settitoloPatrono] = useState(
    getDefaultValue(PatronoMetaField.titoloPatrono)
  );
  const [tipoPatrono, settipoPatrono] = useState(
    getDefaultValue(PatronoMetaField.tipoPatrono)
  );
  const [gradoPatrono, setgradoPatrono] = useState(
    getDefaultValue(PatronoMetaField.gradoPatrono)
  );
  const [card, setcard] = useState(getDefaultValue(PatronoMetaField.card));
  const [astri, setastri] = useState(getDefaultValue(PatronoMetaField.astri));
  const [elemento, setelemento] = useState(
    getDefaultValue(PatronoMetaField.elemento)
  );
  const [classe, setclasse] = useState(
    getDefaultValue(PatronoMetaField.classe)
  );
  const [festivita, setfestivita] = useState(
    getDefaultValue(PatronoMetaField.festivita)
  );
  const [colore, setcolore] = useState(
    getDefaultValue(PatronoMetaField.colore)
  );
  const [tradizione, settradizione] = useState(
    getDefaultValue(PatronoMetaField.tradizione)
  );
  const [allineamento, setallineamento] = useState(
    getDefaultValue(PatronoMetaField.allineamento)
  );
  const [dominioAllineamento, setdominioAllineamento] = useState(
    getDefaultValue(PatronoMetaField.dominioAllineamento)
  );
  const [residenza, setresidenza] = useState(
    getDefaultValue(PatronoMetaField.residenza)
  );
  const [luogo, setluogo] = useState(getDefaultValue(PatronoMetaField.luogo));
  const [significato, setsignificato] = useState(
    getDefaultValue(PatronoMetaField.significato)
  );

  const itemFields: Record<MetaConfigKey, ValueController> = {
    [PatronoMetaField.nome]: {
      setter: setnome,
      value: nome,
    },
    [PatronoMetaField.titoloPatrono]: {
      setter: settitoloPatrono,
      value: titoloPatrono,
    },
    [PatronoMetaField.tipoPatrono]: {
      setter: settipoPatrono,
      value: tipoPatrono,
    },
    [PatronoMetaField.gradoPatrono]: {
      setter: setgradoPatrono,
      value: gradoPatrono,
    },
    [PatronoMetaField.card]: { setter: setcard, value: card },
    [PatronoMetaField.astri]: { setter: setastri, value: astri },
    [PatronoMetaField.elemento]: { setter: setelemento, value: elemento },
    [PatronoMetaField.classe]: { setter: setclasse, value: classe },
    [PatronoMetaField.festivita]: { setter: setfestivita, value: festivita },
    [PatronoMetaField.colore]: { setter: setcolore, value: colore },
    [PatronoMetaField.tradizione]: { setter: settradizione, value: tradizione },
    [PatronoMetaField.allineamento]: {
      setter: setallineamento,
      value: allineamento,
    },
    [PatronoMetaField.dominioAllineamento]: {
      setter: setdominioAllineamento,
      value: dominioAllineamento,
    },
    [PatronoMetaField.residenza]: { setter: setresidenza, value: residenza },
    [PatronoMetaField.luogo]: { setter: setluogo, value: luogo },
    [PatronoMetaField.significato]: {
      setter: setsignificato,
      value: significato,
    },
  };

  const { page, setField, getField } = usePageManager(itemFields);

  if (!isCreateMode) {
    page.id = pageItem.id;
  }

  const editedFields = Object.keys(itemFields).reduce((acc, key) => {
    const typedKey = key as PatronoMetaField;
    if (itemFields[typedKey].value !== getDefaultValue(typedKey)) {
      acc.push(typedKey);
    }
    return acc;
  }, [] as PatronoMetaField[]);

  return {
    editedFields,
    page,
    setField,
    getField,
  };
};

export default useDeityPageManager;
