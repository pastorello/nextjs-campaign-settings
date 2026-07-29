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
  const markup = { __html: props.cardItem[SpellMetaField.description] };

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 text-sm text-white outline outline-offset-1 outline-white/10">
        <DisclosureButton className="mb-2 flex w-full group">
          <div className="w-[50px] items-center text-3xl">
            {pageMetaFields[SpellMetaField.level].getDatum(
              props.cardItem[SpellMetaField.level],
              true
            )}
          </div>
          <div className="flex-1">
            <div className="text-xl">
              {pageMetaFields[SpellMetaField.name].getDatum(
                props.cardItem[SpellMetaField.name]
              )}{" "}
              {props.cardItem[SpellMetaField.ritual] == true && "(rituale)"}
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
                value={pageMetaFields[SpellMetaField.castingTime].getDatum(
                  props.cardItem[SpellMetaField.castingTime]
                )}
              />
              <ItemMeta
                label="Gittata"
                value={pageMetaFields[SpellMetaField.range].getDatum(
                  props.cardItem[SpellMetaField.range]
                )}
              />
              <ItemMeta
                label="Durata"
                value={pageMetaFields[SpellMetaField.duration].getDatum(
                  props.cardItem[SpellMetaField.duration]
                )}
              />
            </div>
            <div className="w-[50%] p-1">
              <ItemMeta
                label="Sottoclassi"
                value={pageMetaFields[SpellMetaField.circle].getDatum(
                  props.cardItem[SpellMetaField.circle]
                )}
              />
              <ItemMeta
                label="Componenti"
                value={pageMetaFields[SpellMetaField.components].getDatum(
                  props.cardItem[SpellMetaField.components]
                )}
              />
            </div>
          </div>
          <hr className="my-2" />
          <div
            dangerouslySetInnerHTML={markup}
            className="mb-1 p-3 text-base first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold"
          />
          {isValidString(props.cardItem[SpellMetaField.upcast]) && (
            <div className="w-full px-3 pb-2 text-base">
              <hr className="my-2" />
              <ItemMeta
                label="A livelli superiori"
                value={pageMetaFields[SpellMetaField.upcast].getDatum(
                  props.cardItem[SpellMetaField.upcast]
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
