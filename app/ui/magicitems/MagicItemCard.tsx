import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";

const MagicItemCard = (props: { cardItem: MagicItem }) => {
  const markup = { __html: props.cardItem.descrizione };

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 p-4 text-sm text-white outline outline-offset-1 outline-white/10">
        <DisclosureButton className="mb-2 flex w-full group">
          <div className="flex-1 text-left">
            <h3 className="text-xl">
              {pageMetaFields[MagicItemMetaField.nome].getDatum(
                props.cardItem[MagicItemMetaField.nome]
              )}
            </h3>
            <p>
              {props.cardItem[MagicItemMetaField.sintonia] === true &&
                "Richiede sintonia"}
            </p>
          </div>
          <div className="w-[250px] px-2">
            <div className="text-xl">
              {pageMetaFields[MagicItemMetaField.tipo].getDatum(
                props.cardItem[MagicItemMetaField.tipo]
              )}
            </div>
            <div className="text-gray-400">
              {pageMetaFields[MagicItemMetaField.rarita].getDatum(
                props.cardItem[MagicItemMetaField.rarita]
              )}
            </div>
          </div>
          <div className="w-[40px] group-data-open:rotate-180">
            <Icon iconType={IconType.chevronDown} />
          </div>
        </DisclosureButton>
        <DisclosurePanel>
          <div className="flex w-full p-2">
            <div
              dangerouslySetInnerHTML={markup}
              className="mb-1 p-3 text-base first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold"
            />
          </div>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};

export default MagicItemCard;
