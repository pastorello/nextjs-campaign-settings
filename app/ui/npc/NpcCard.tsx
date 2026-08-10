import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useTranslations } from "next-intl";

import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import AssignLocationButton from "../buttons/AssignLocationButton";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";
import DerivedPlacement from "@/app/lib/definitions/interfaces/maps/DerivedPlacement";
import PageType from "@/app/lib/definitions/types/PageType";

const NpcCard = (props: {
  cardItem: NpcItem;
  /** Absent while nobody has pinned this NPC anywhere (SPEC-004 T5a). */
  placement?: DerivedPlacement | undefined;
}) => {
  const t = useTranslations();
  const markup = { __html: props.cardItem.description };
  const locationLabel = props.placement?.place ?? t("common.location.unknown");

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 p-4 text-sm text-white outline outline-offset-1 outline-white/10">
        <div className="mb-2 flex w-full">
          <DisclosureButton className="flex flex-1 text-left">
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
          </DisclosureButton>
          {/* Derived from the NPC's pin in the world tree, not from the
              `location` column beside it — see SPEC-004 §5 point 6.
              "Sconosciuta" and clickable rather than blank when nobody has
              placed them yet (SPEC-007 T3) — a sibling of `DisclosureButton`,
              not nested inside it, since it is its own button. */}
          <div className="w-[200px] text-xl">
            <AssignLocationButton
              pageType={PageType.Npc}
              entityId={props.cardItem.id}
              currentZoneId={props.placement?.zoneId ?? null}
              currentPoiId={props.placement?.poiId ?? null}
              currentLocationLabel={locationLabel}
              variant="text"
            />
          </div>
          <DisclosureButton
            className="w-[40px] group-data-open:rotate-180"
            aria-label={t("common.card.toggleDetails")}
          >
            <Icon iconType={IconType.chevronDown} />
          </DisclosureButton>
        </div>
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
