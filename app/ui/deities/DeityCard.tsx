import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import clsx from "clsx";

import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import ItemMeta from "../components/ItemMeta";
import Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";
import DeityRank from "@/app/lib/definitions/enums/deities/DeityRank";

const DeityCard = (props: { cardItem: Deity }) => {
  return (
    <Disclosure>
      <div
        className={clsx(
          `my-2 w-full rounded-xl bg-slate-800 text-sm text-white outline outline-offset-1`,
          `border-8 ${pageMetaFields[DeityMetaField.color].getDatum(
            props.cardItem[DeityMetaField.color],
            true
          )}`
        )}
      >
        <DisclosureButton className="m-2 flex w-full group">
          <div
            className={clsx(
              "w-[50px] items-center flex justify-center rounded-full text-2xl",
              {
                "bg-white p-2 text-black":
                  props.cardItem[DeityMetaField.deityRank] ===
                  DeityRank.Divinità,
              }
            )}
          >
            {props.cardItem[DeityMetaField.tarotCard]}
          </div>
          <div className="flex-1">
            <div>
              <div className="text-xl">
                {pageMetaFields[DeityMetaField.name].getDatum(
                  props.cardItem[DeityMetaField.name]
                )}
                {", "}
                <span className="text-sm text-gray-400">
                  {pageMetaFields[DeityMetaField.deityTitle].getDatum(
                    props.cardItem[DeityMetaField.deityTitle]
                  )}
                </span>
              </div>
            </div>
            <div>
              {`${pageMetaFields[DeityMetaField.deityRank].getDatum(
                props.cardItem[DeityMetaField.deityRank]
              )} ${pageMetaFields[DeityMetaField.deityType].getDatum(
                props.cardItem[DeityMetaField.deityType]
              )}, ${pageMetaFields[DeityMetaField.alignmentDomain].getDatum(
                props.cardItem[DeityMetaField.alignmentDomain]
              )}/
                ${pageMetaFields[DeityMetaField.alignment].getDatum(
                  props.cardItem[DeityMetaField.alignment]
                )} (${pageMetaFields[DeityMetaField.deityClass].getDatum(
                  props.cardItem[DeityMetaField.deityClass]
                )})`}
            </div>
          </div>
          <div className="w-[40px] group-data-open:rotate-180">
            <Icon iconType={IconType.chevronDown} />
          </div>
        </DisclosureButton>
        <DisclosurePanel>
          <hr className="my-2" />
          <div className="flex w-full p-2">
            <div className="w-[50%] p-1">
              <ItemMeta
                label="Residenza"
                value={`${pageMetaFields[DeityMetaField.location].getDatum(
                  props.cardItem[DeityMetaField.location]
                )}, ${pageMetaFields[DeityMetaField.residence].getDatum(
                  props.cardItem[DeityMetaField.residence]
                )}`}
              />
              <ItemMeta
                label="Astro associato"
                value={pageMetaFields[DeityMetaField.celestialBody].getDatum(
                  props.cardItem[DeityMetaField.celestialBody]
                )}
              />
              <ItemMeta
                label="Festività"
                value={pageMetaFields[DeityMetaField.holidays].getDatum(
                  props.cardItem[DeityMetaField.holidays]
                )}
              />
            </div>
            <div className="w-[50%] p-1">
              <ItemMeta
                label="Tarocco"
                value={`${pageMetaFields[DeityMetaField.tarotCard].getDatum(
                  props.cardItem[DeityMetaField.tarotCard]
                )}`}
              />
              <ItemMeta
                label="Significato"
                value={pageMetaFields[DeityMetaField.meaning].getDatum(
                  props.cardItem[DeityMetaField.meaning]
                )}
              />
              <ItemMeta
                label="Elemento"
                value={`${pageMetaFields[DeityMetaField.element].getDatum(
                  props.cardItem[DeityMetaField.element]
                )} (${pageMetaFields[DeityMetaField.tradition].getDatum(
                  props.cardItem[DeityMetaField.tradition]
                )})`}
              />
            </div>
          </div>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};

export default DeityCard;
