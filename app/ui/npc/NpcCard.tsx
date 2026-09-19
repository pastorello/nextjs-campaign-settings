import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import RecordThumbnail from "../components/RecordThumbnail";
import RecordDisplayImage from "../components/RecordDisplayImage";
import AssignLocationButton from "../buttons/AssignLocationButton";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";
import DerivedPlacement from "@/app/lib/definitions/interfaces/maps/DerivedPlacement";
import PageType from "@/app/lib/definitions/types/PageType";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

const NpcCard = (props: {
  cardItem: NpcItem;
  /** Absent while nobody has pinned this NPC anywhere (SPEC-004 T5a). */
  placement?: DerivedPlacement | undefined;
  /** Resolves the faction name below — absent renders an em dash. */
  optionBundle?: OptionBundle | undefined;
}) => {
  const t = useTranslations();
  const system = useGameSystem();
  const locationLabel = props.placement?.place ?? t("common.location.unknown");
  // Resolved directly from the bundle rather than through `resolveFieldValue`:
  // the link needs the same name the label displays, and building both from
  // one lookup is simpler than deriving the href from a rendered ReactNode.
  const faction = props.optionBundle?.faction?.find(
    (option) => option.value === props.cardItem[NpcMetaField.faction]
  );

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 p-4 text-sm text-white outline outline-offset-1 outline-white/10">
        <div className="mb-2 flex w-full flex-wrap items-center gap-x-4 gap-y-1 md:flex-nowrap">
          {/* Beside the button, not inside it: the thumbnail's alt text
              would otherwise join the button's accessible name. */}
          <RecordThumbnail
            image={props.cardItem.image}
            name={props.cardItem.name}
            size="md"
          />
          <DisclosureButton className="flex min-w-0 flex-1 flex-col gap-1 text-left md:flex-row">
            <div className="text-left md:w-48 md:shrink-0">
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
            {/* The name block has a fixed width and this takes the rest
                (TD-118). With the widths the other way round — a fixed
                600px, then 360px, here and flex-1 on the name — the name was
                squeezed until "Aldric Valmonte" and its subtitle wrapped over
                four lines. Stacked below `md` (TD-114). */}
            <div className="min-w-0 flex-1 text-gray-400 text-left">
              {pageMetaFields[NpcMetaField.appearance].getDatum(
                props.cardItem[NpcMetaField.appearance]
              )}
            </div>
          </DisclosureButton>
          {/* A link, so — like `AssignLocationButton` below it — a sibling of
              `DisclosureButton` rather than nested inside it: an `<a>` inside
              a `<button>` is invalid HTML, and its click would also toggle
              the disclosure (SPEC-006 T8). An em dash for no faction
              (decision 8), not a link to nowhere. */}
          <div className="self-center text-base md:w-[150px]">
            {faction ? (
              <Link
                href={dashboardPath(
                  system,
                  `/factions?query=${encodeURIComponent(faction.label)}`
                )}
                className="text-blue-300 hover:underline"
              >
                {faction.label}
              </Link>
            ) : (
              "—"
            )}
          </div>
          {/* Derived from the NPC's pin in the world tree, not from the
              `location` column beside it — see SPEC-004 §5 point 6.
              "Sconosciuta" and clickable rather than blank when nobody has
              placed them yet (SPEC-007 T3) — a sibling of `DisclosureButton`,
              not nested inside it, since it is its own button. */}
          {/* Was text-xl — the same size as the NPC's own name above, so the
              eye went to the place first (TD-118). */}
          <div className="text-sm md:w-[200px]">
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
            className="group flex h-10 w-10 items-center justify-center"
            aria-label={t("common.card.toggleDetails")}
          >
            <Icon
              iconType={IconType.chevronDown}
              className="transition-transform group-data-open:rotate-180"
            />
          </DisclosureButton>
        </div>
        <DisclosurePanel>
          {props.cardItem.image && (
            <div className="flex justify-center p-2">
              <RecordDisplayImage
                image={props.cardItem.image}
                name={props.cardItem.name}
              />
            </div>
          )}
          <div className="flex w-full p-2">
            {pageMetaFields[NpcMetaField.personality].getDatum(
              props.cardItem[NpcMetaField.personality]
            )}
          </div>
          <div className="flex w-full p-2">
            <div className="mb-1 p-3 text-base first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold">
              {pageMetaFields.description.getDatum(
                props.cardItem.description ?? ""
              )}
            </div>
          </div>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};

export default NpcCard;
