import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import ItemMeta from "../components/ItemMeta";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import isValidString from "@/app/lib/utils/validators/isValidString";
import pageMetaFields from "@/app/lib/config/pageMetaFields";

const SpellCard = (props: { cardItem: Spell }) => {
  const markup = { __html: props.cardItem[SpellMetaField.descrizione] };

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 text-sm text-white outline outline-offset-1 outline-white/10">
        <DisclosureButton className="mb-2 flex w-full group">
          <div className="w-[50px] items-center text-3xl">
            {pageMetaFields[SpellMetaField.livello].getDatum(
              props.cardItem[SpellMetaField.livello],
              { useShortLabel: true }
            )}
          </div>
          <div className="flex-1">
            <div className="text-xl">
              {pageMetaFields[SpellMetaField.nome].getDatum(
                props.cardItem[SpellMetaField.nome]
              )}{" "}
              {props.cardItem[SpellMetaField.rituale] == true && "(rituale)"}
            </div>
          </div>
          <div className="w-[40px] group-data-open:rotate-180">
            <Icon iconType={IconType.chevronDown} />
          </div>
        </DisclosureButton>
        <DisclosurePanel>
          <div className="flex w-full p-2">
            <div className="w-[50%] p-1">
              <ItemMeta
                label="Tempo di lancio"
                value={pageMetaFields[SpellMetaField.tempoDiLancio].getDatum(
                  props.cardItem[SpellMetaField.tempoDiLancio]
                )}
              />
              <ItemMeta
                label="Gittata"
                value={pageMetaFields[SpellMetaField.gittata].getDatum(
                  props.cardItem[SpellMetaField.gittata]
                )}
              />
              <ItemMeta
                label="Durata"
                value={pageMetaFields[SpellMetaField.durata].getDatum(
                  props.cardItem[SpellMetaField.durata]
                )}
              />
            </div>
            <div className="w-[50%] p-1">
              <ItemMeta
                label="Circolo"
                value={pageMetaFields[SpellMetaField.circolo].getDatum(
                  props.cardItem[SpellMetaField.circolo]
                )}
              />
              <ItemMeta
                label="Componenti"
                value={pageMetaFields[SpellMetaField.componenti].getDatum(
                  props.cardItem[SpellMetaField.componenti]
                )}
              />
            </div>
          </div>
          <hr className="my-2" />
          <div
            dangerouslySetInnerHTML={markup}
            className="mb-1 p-3 text-base first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold"
          />
          {isValidString(props.cardItem[SpellMetaField.intensificato]) && (
            <div className="w-full px-3 pb-2 text-base">
              <hr className="my-2" />
              <ItemMeta
                label="A livelli superiori"
                value={pageMetaFields[SpellMetaField.intensificato].getDatum(
                  props.cardItem[SpellMetaField.intensificato]
                )}
              />
            </div>
          )}
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};

export default SpellCard;
