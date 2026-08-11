import { getTranslations } from "next-intl/server";

import renderFieldValue from "@/app/lib/utils/data/renderFieldValue";
import listConfig from "@/app/lib/config/listConfig";
import isArrayEmpty from "@/app/lib/utils/validators/isArrayEmpty";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import PageType from "@/app/lib/definitions/types/PageType";
import { SearchParamsInput } from "@/app/lib/data/validateParams";

import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import { fetchFilteredFactions } from "@/app/lib/data/faction/fetchFilteredFactions";
import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import fetchEntityLocationSummaries from "@/app/lib/data/maps/fetchEntityLocationSummaries";
import type LocationSummary from "@/app/lib/definitions/interfaces/maps/LocationSummary";
import type OptionBundle from "@/app/lib/definitions/types/OptionBundle";

import SortableHeader from "../buttons/SortableHeader";
import DeleteButton from "../buttons/DeleteButton";
import ModalButton from "../buttons/ModalButton";
import AssignLocationButton from "../buttons/AssignLocationButton";
import LocationFilterControl from "./LocationFilterControl";

const NAME_FIELD = "name";

/**
 * The admin list for any domain, driven by `listConfig` (TD-09).
 *
 * Replaces `SpellList`, `PngList`, `DeityList` and `MagicItemsList`, which were
 * ~110 lines each and differed only in their columns, their empty message and
 * which form the edit dialog opened. The metadata layer already knows how to
 * render every field, so that duplication was unnecessary by construction —
 * and it had produced three real defects in the deities list alone.
 *
 * Stays an async server component that fetches its own rows: the admin pages
 * wrap it in `<Suspense>` precisely so the query streams. Awaiting the fetch a
 * level up would make that boundary decorative.
 */

/**
 * Kept as an explicit switch rather than a lookup table in `listConfig`. The
 * config lives in `app/lib/config/`, the fetches in `app/lib/data/`, and the
 * data layer already imports the config — pointing the config back at the data
 * layer would close that loop for no benefit.
 */
const fetchItems = (pageType: PageType, searchParams: SearchParamsInput) => {
  switch (pageType) {
    case PageType.Spell:
      return fetchFilteredSpells(searchParams);
    case PageType.Npc:
      return fetchFilteredNpc(searchParams);
    case PageType.Deity:
      return fetchFilteredDeities(searchParams);
    case PageType.MagicItem:
      return fetchFilteredMagicItems(searchParams);
    case PageType.Faction:
      return fetchFilteredFactions(searchParams);
  }
};

export default async function EntityList(props: {
  pageType: PageType;
  searchParams?: SearchParamsInput | undefined;
}) {
  const t = await getTranslations();
  const config = listConfig[props.pageType];
  const items = (await fetchItems(
    props.pageType,
    props.searchParams ?? {}
  )) as unknown as ListItem[];

  // Attached after the fetch, not read from it: `fetchFiltered*`'s result
  // schema (`buildResultSchema`, keyed off `pagesConfig`) strips any key it
  // does not declare, and `location` deliberately isn't declared there (see
  // `pageMetaFields.ts`) — it is never part of the write schema.
  let locationSummaries: Map<number, LocationSummary> | null = null;
  if (props.pageType === PageType.Npc || props.pageType === PageType.Deity) {
    const linkedType = props.pageType === PageType.Npc ? "npc" : "deity";
    locationSummaries = await fetchEntityLocationSummaries(linkedType);
    for (const item of items) {
      item.location =
        locationSummaries.get(item.id as number)?.title ??
        t("common.location.unknown");
    }
  }

  // Resolved once per request and passed down as a prop (SPEC-006 §7,
  // decision 10) — only the NPC list has a table-backed field today.
  const optionBundle: OptionBundle | undefined =
    props.pageType === PageType.Npc
      ? { faction: await fetchFieldOptions("faction") }
      : undefined;

  return (
    <div className="mt-6 flow-root">
      {locationSummaries && <LocationFilterControl />}
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          {isArrayEmpty(items) && <p>{t(config.emptyMessageKey)}</p>}
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  <SortableHeader
                    label={t("common.table.name")}
                    fieldKey={NAME_FIELD}
                    isFiltrable={false}
                  />
                </th>
                {config.columns.map((column) => (
                  <th
                    key={column.fieldKey}
                    scope="col"
                    className="px-3 py-5 font-medium"
                  >
                    {column.sortable === false ? (
                      t(column.labelKey)
                    ) : (
                      <SortableHeader
                        label={t(column.labelKey)}
                        fieldKey={column.fieldKey}
                        isFiltrable={column.isFiltrable ?? true}
                      />
                    )}
                  </th>
                ))}
                <th
                  scope="col"
                  className="relative py-5 pl-6 pr-3 justify-center flex"
                >
                  {t("common.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {items?.map((item) => (
                <tr
                  key={item.id as number}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p>
                        <strong>
                          {renderFieldValue(NAME_FIELD, item.name, t)}
                        </strong>
                        {config.subtitleField && (
                          <>
                            <br />
                            {renderFieldValue(
                              config.subtitleField,
                              item[config.subtitleField],
                              t
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  </td>
                  {config.columns.map((column) => (
                    <td key={column.fieldKey} className="px-3 py-3">
                      {renderFieldValue(
                        column.fieldKey,
                        item[column.fieldKey],
                        t,
                        optionBundle
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      {locationSummaries &&
                        (props.pageType === PageType.Npc ||
                          props.pageType === PageType.Deity) && (
                          <AssignLocationButton
                            pageType={props.pageType}
                            entityId={item.id as number}
                            currentZoneId={
                              locationSummaries.get(item.id as number)
                                ?.zoneId ?? null
                            }
                            currentPoiId={
                              locationSummaries.get(item.id as number)?.poiId ??
                              null
                            }
                            currentLocationLabel={
                              locationSummaries.get(item.id as number)?.title ??
                              t("common.location.unknown")
                            }
                          />
                        )}
                      <ModalButton
                        buttonLabel={t("common.table.edit")}
                        modalTitle={t(config.editModalTitleKey)}
                        modalContent={config.modalContent}
                        componentProps={{ formData: item }}
                        optionBundle={optionBundle}
                      />
                      <DeleteButton
                        pageName={item.name as string}
                        pageId={item.id as number}
                        pageType={props.pageType}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
