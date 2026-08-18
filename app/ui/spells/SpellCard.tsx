import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useTranslations } from "next-intl";

import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import ItemMeta from "../components/ItemMeta";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import isValidString from "@/app/lib/utils/validators/isValidString";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";

const SpellCard = (props: { cardItem: Spell }) => {
  const t = useTranslations();
  const markup = { __html: props.cardItem[SpellMetaField.description] };

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 text-sm text-white outline outline-offset-1 outline-white/10">
        <DisclosureButton className="mb-2 flex w-full group">
          <div className="w-[50px] items-center text-3xl">
            {resolveFieldValue(
              pageMetaFields[SpellMetaField.level],
              props.cardItem[SpellMetaField.level],
              t,
              true
            )}
          </div>
          <div className="flex-1">
            <div className="text-xl">
              {pageMetaFields[SpellMetaField.name].getDatum?.(
                props.cardItem[SpellMetaField.name]
              )}{" "}
              {props.cardItem[SpellMetaField.ritual] == true &&
                t("spells.card.ritual")}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center">
            <Icon
              iconType={IconType.chevronDown}
              className="transition-transform group-data-open:rotate-180"
            />
          </div>
        </DisclosureButton>
        <DisclosurePanel>
          <div className="flex w-full p-2">
            <div className="w-[50%] p-1">
              <ItemMeta
                label={t("spells.card.castingTime")}
                value={resolveFieldValue(
                  pageMetaFields[SpellMetaField.castingTime],
                  props.cardItem[SpellMetaField.castingTime],
                  t
                )}
              />
              <ItemMeta
                label={t("spells.card.range")}
                value={resolveFieldValue(
                  pageMetaFields[SpellMetaField.range],
                  props.cardItem[SpellMetaField.range],
                  t
                )}
              />
              <ItemMeta
                label={t("spells.card.duration")}
                value={resolveFieldValue(
                  pageMetaFields[SpellMetaField.duration],
                  props.cardItem[SpellMetaField.duration],
                  t
                )}
              />
            </div>
            <div className="w-[50%] p-1">
              <ItemMeta
                label={t("spells.card.subclasses")}
                value={resolveFieldValue(
                  pageMetaFields[SpellMetaField.circle],
                  props.cardItem[SpellMetaField.circle],
                  t
                )}
              />
              <ItemMeta
                label={t("spells.card.components")}
                value={pageMetaFields[SpellMetaField.components].getDatum?.(
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
                label={t("spells.card.upcast")}
                value={pageMetaFields[SpellMetaField.upcast].getDatum?.(
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
