import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import Icon from "../components/Icon";
import IconType from "../buttons/BaseButton/IconType";
import RecordThumbnail from "../components/RecordThumbnail";
import RecordDisplayImage from "../components/RecordDisplayImage";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import { RosterMember } from "@/app/lib/data/faction/fetchFactionRosters";

const FactionCard = (props: { cardItem: Faction; roster: RosterMember[] }) => {
  const t = useTranslations("factions.card");
  const system = useGameSystem();

  return (
    <Disclosure>
      <div className="my-2 w-full gap-x-4 rounded-xl bg-slate-800 p-4 text-sm text-white outline outline-offset-1 outline-white/10">
        {/* Beside the button, not inside it: the thumbnail's alt text
            would otherwise join the button's accessible name. */}
        <div className="mb-2 flex w-full items-start gap-3">
          <RecordThumbnail
            image={props.cardItem.image}
            name={props.cardItem.name}
            size="md"
          />
          <DisclosureButton className="flex min-w-0 flex-1 group">
            <div className="flex-1 text-left">
              <h3 className="text-xl">{props.cardItem.name}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center">
              <Icon
                iconType={IconType.chevronDown}
                className="transition-transform group-data-open:rotate-180"
              />
            </div>
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
          <div className="flex w-full flex-col p-2">
            <div className="mb-1 p-3 text-base first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold">
              {pageMetaFields.description.getDatum(
                props.cardItem.description ?? ""
              )}
            </div>
            <div className="p-3">
              <h4 className="mb-2 text-lg">{t("rosterTitle")}</h4>
              {props.roster.length === 0 ? (
                <p className="text-gray-400">{t("emptyRoster")}</p>
              ) : (
                <ul className="list-disc pl-5">
                  {props.roster.map((member) => (
                    <li key={member.id}>
                      <Link
                        href={dashboardPath(
                          system,
                          `/npc?query=${encodeURIComponent(member.name)}`
                        )}
                        className="text-blue-400 hover:underline"
                      >
                        {member.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
};

export default FactionCard;
