import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import clsx from "clsx";

import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import ItemMeta from "../components/ItemMeta";
import Patrono from "@/app/lib/definitions/interfaces/deities/Patrono";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import PatronoMetaField from "@/app/lib/definitions/enums/deities/PatronoMetaField";
import GradoPatrono from "@/app/lib/definitions/enums/deities/GradoPatrono";

const DeityCard = (props: { cardItem: Patrono }) => {
  return (
    <Disclosure>
      <div
        className={clsx(
          `my-2 w-full rounded-xl bg-slate-800 text-sm text-white outline outline-offset-1`,
          `border-8 ${pageMetaFields[PatronoMetaField.colore].getDatum(
            props.cardItem[PatronoMetaField.colore],
            "colorClass"
          )}`
        )}
      >
        <DisclosureButton className="m-2 flex w-full group">
          <div
            className={clsx(
              "w-[50px] items-center flex justify-center rounded-full text-2xl",
              {
                "bg-white p-2 text-black":
                  props.cardItem[PatronoMetaField.gradoPatrono] ===
                  GradoPatrono.Divinità,
              }
            )}
          >
            {props.cardItem[PatronoMetaField.card]}
          </div>
          <div className="flex-1">
            <div>
              <div className="text-xl">
                {pageMetaFields[PatronoMetaField.nome].getDatum(
                  props.cardItem[PatronoMetaField.nome]
                )}
                {", "}
                <span className="text-sm text-gray-400">
                  {pageMetaFields[PatronoMetaField.titoloPatrono].getDatum(
                    props.cardItem[PatronoMetaField.titoloPatrono]
                  )}
                </span>
              </div>
            </div>
            <div>
              {`${pageMetaFields[PatronoMetaField.gradoPatrono].getDatum(
                props.cardItem[PatronoMetaField.gradoPatrono]
              )} ${pageMetaFields[PatronoMetaField.tipoPatrono].getDatum(
                props.cardItem[PatronoMetaField.tipoPatrono]
              )}, ${pageMetaFields[
                PatronoMetaField.dominioAllineamento
              ].getDatum(props.cardItem[PatronoMetaField.dominioAllineamento])}/
                ${pageMetaFields[PatronoMetaField.allineamento].getDatum(
                  props.cardItem[PatronoMetaField.allineamento]
                )} (${pageMetaFields[PatronoMetaField.classe].getDatum(
                props.cardItem[PatronoMetaField.classe]
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
                value={`${pageMetaFields[PatronoMetaField.luogo].getDatum(
                  props.cardItem[PatronoMetaField.luogo]
                )}, ${pageMetaFields[PatronoMetaField.residenza].getDatum(
                  props.cardItem[PatronoMetaField.residenza]
                )}`}
              />
              <ItemMeta
                label="Astro associato"
                value={pageMetaFields[PatronoMetaField.astri].getDatum(
                  props.cardItem[PatronoMetaField.astri]
                )}
              />
              <ItemMeta
                label="Festività"
                value={pageMetaFields[PatronoMetaField.festivita].getDatum(
                  props.cardItem[PatronoMetaField.festivita]
                )}
              />
            </div>
            <div className="w-[50%] p-1">
              <ItemMeta
                label="Tarocco"
                value={`${pageMetaFields[PatronoMetaField.card].getDatum(
                  props.cardItem[PatronoMetaField.card]
                )}`}
              />
              <ItemMeta
                label="Significato"
                value={pageMetaFields[PatronoMetaField.significato].getDatum(
                  props.cardItem[PatronoMetaField.significato]
                )}
              />
              <ItemMeta
                label="Elemento"
                value={`${pageMetaFields[PatronoMetaField.elemento].getDatum(
                  props.cardItem[PatronoMetaField.elemento]
                )} (${pageMetaFields[PatronoMetaField.tradizione].getDatum(
                  props.cardItem[PatronoMetaField.tradizione]
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
