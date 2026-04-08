import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import PngItem from "@/app/lib/definitions/interfaces/png/PngItem";
import PngMetaField from "@/app/lib/definitions/enums/png/PngMetaField";

const PngCard = (props: { cardItem: PngItem }) => {
  const markup = { __html: props.cardItem.descrizione };

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 p-4 text-sm text-white outline outline-offset-1 outline-white/10">
        <DisclosureButton className="mb-2 flex w-full">
          <div className="flex-1 text-left">
            <h3 className="text-xl">
              {pageMetaFields[PngMetaField.nome].getDatum(
                props.cardItem[PngMetaField.nome]
              )}
            </h3>
            <p>
              {pageMetaFields[PngMetaField.titolo].getDatum(
                props.cardItem[PngMetaField.titolo]
              )}
            </p>
            <p>
              {pageMetaFields[PngMetaField.mansione].getDatum(
                props.cardItem[PngMetaField.mansione]
              )}
            </p>
          </div>
          <div className="w-[600px] text-gray-400 text-left">
            {pageMetaFields[PngMetaField.aspetto].getDatum(
              props.cardItem[PngMetaField.aspetto]
            )}
          </div>
          <div className="w-[200px] text-xl">
            {pageMetaFields[PngMetaField.luogo].getDatum(
              props.cardItem[PngMetaField.luogo]
            )}
          </div>
          <div className="w-[40px] group-data-open:rotate-180">
            <Icon iconType={IconType.chevronDown} />
          </div>
        </DisclosureButton>
        <DisclosurePanel>
          <div className="flex w-full p-2">
            {pageMetaFields[PngMetaField.personalita].getDatum(
              props.cardItem[PngMetaField.personalita]
            )}
          </div>
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

export default PngCard;
