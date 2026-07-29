import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";

const NpcCard = (props: { cardItem: NpcItem }) => {
  const markup = { __html: props.cardItem.description };

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 p-4 text-sm text-white outline outline-offset-1 outline-white/10">
        <DisclosureButton className="mb-2 flex w-full">
          <div className="flex-1 text-left">
            <h3 className="text-xl">
              {pageMetaFields[NpcMetaField.name].getDatum(
                props.cardItem[NpcMetaField.name]
              )}
            </h3>
            <p>
              {pageMetaFields[NpcMetaField.title].getDatum(
                props.cardItem[NpcMetaField.title]
              )}
            </p>
            <p>
              {pageMetaFields[NpcMetaField.position].getDatum(
                props.cardItem[NpcMetaField.position]
              )}
            </p>
          </div>
          <div className="w-[600px] text-gray-400 text-left">
            {pageMetaFields[NpcMetaField.appearance].getDatum(
              props.cardItem[NpcMetaField.appearance]
            )}
          </div>
          <div className="w-[200px] text-xl">
            {pageMetaFields[NpcMetaField.location].getDatum(
              props.cardItem[NpcMetaField.location]
            )}
          </div>
          <div className="w-[40px] group-data-open:rotate-180">
            <Icon iconType={IconType.chevronDown} />
          </div>
        </DisclosureButton>
        <DisclosurePanel>
          <div className="flex w-full p-2">
            {pageMetaFields[NpcMetaField.personality].getDatum(
              props.cardItem[NpcMetaField.personality]
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

export default NpcCard;
