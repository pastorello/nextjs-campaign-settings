import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import ItemMeta from "../components/ItemMeta";
import Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";
import DeityRank from "@/app/lib/definitions/enums/deities/DeityRank";
import magicColors from "@/app/lib/config/deity/magicColors";
import getOptionColorClass from "@/app/lib/utils/data/getOptionColorClass";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";

const DeityCard = (props: { cardItem: Deity }) => {
  const t = useTranslations();
  return (
    <Disclosure>
      <div
        className={clsx(
          `my-2 w-full rounded-xl bg-slate-800 text-sm text-white outline outline-offset-1`,
          `border-8 ${getOptionColorClass(
            magicColors,
            props.cardItem[DeityMetaField.color]
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
                {pageMetaFields[DeityMetaField.name].getDatum?.(
                  props.cardItem[DeityMetaField.name]
                )}
                {", "}
                <span className="text-sm text-gray-400">
                  {pageMetaFields[DeityMetaField.deityTitle].getDatum?.(
                    props.cardItem[DeityMetaField.deityTitle]
                  )}
                </span>
              </div>
            </div>
            {/* resolveFieldValue is typed ReactNode (it can fall back to a
                genuinely-rich getDatum); these calls are all option-backed
                fields, which resolveFieldValue always resolves through
                getDataLabel to a plain string. */}
            <div>
              {`${
                resolveFieldValue(
                  pageMetaFields[DeityMetaField.deityRank],
                  props.cardItem[DeityMetaField.deityRank],
                  t
                ) as string
              } ${
                resolveFieldValue(
                  pageMetaFields[DeityMetaField.deityType],
                  props.cardItem[DeityMetaField.deityType],
                  t
                ) as string
              }, ${
                resolveFieldValue(
                  pageMetaFields[DeityMetaField.alignmentDomain],
                  props.cardItem[DeityMetaField.alignmentDomain],
                  t
                ) as string
              }/
                ${
                  resolveFieldValue(
                    pageMetaFields[DeityMetaField.alignment],
                    props.cardItem[DeityMetaField.alignment],
                    t
                  ) as string
                } (${
                  resolveFieldValue(
                    pageMetaFields[DeityMetaField.deityClass],
                    props.cardItem[DeityMetaField.deityClass],
                    t
                  ) as string
                })`}
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
                label={t("deities.card.residence")}
                value={`${
                  resolveFieldValue(
                    pageMetaFields[DeityMetaField.location],
                    props.cardItem[DeityMetaField.location],
                    t
                  ) as string
                }, ${
                  resolveFieldValue(
                    pageMetaFields[DeityMetaField.residence],
                    props.cardItem[DeityMetaField.residence],
                    t
                  ) as string
                }`}
              />
              <ItemMeta
                label={t("deities.card.celestialBody")}
                value={resolveFieldValue(
                  pageMetaFields[DeityMetaField.celestialBody],
                  props.cardItem[DeityMetaField.celestialBody],
                  t
                )}
              />
              <ItemMeta
                label={t("deities.card.holidays")}
                value={pageMetaFields[DeityMetaField.holidays].getDatum?.(
                  props.cardItem[DeityMetaField.holidays]
                )}
              />
            </div>
            <div className="w-[50%] p-1">
              <ItemMeta
                label={t("deities.card.tarotCard")}
                value={
                  resolveFieldValue(
                    pageMetaFields[DeityMetaField.tarotCard],
                    props.cardItem[DeityMetaField.tarotCard],
                    t
                  ) as string
                }
              />
              <ItemMeta
                label={t("deities.card.meaning")}
                value={pageMetaFields[DeityMetaField.meaning].getDatum?.(
                  props.cardItem[DeityMetaField.meaning]
                )}
              />
              <ItemMeta
                label={t("deities.card.element")}
                value={`${
                  resolveFieldValue(
                    pageMetaFields[DeityMetaField.element],
                    props.cardItem[DeityMetaField.element],
                    t
                  ) as string
                } (${
                  resolveFieldValue(
                    pageMetaFields[DeityMetaField.tradition],
                    props.cardItem[DeityMetaField.tradition],
                    t
                  ) as string
                })`}
              />
            </div>
          </div>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};

export default DeityCard;
