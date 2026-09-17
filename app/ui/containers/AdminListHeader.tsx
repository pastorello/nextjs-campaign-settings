import BaseButton from "../buttons/BaseButton";
import { ResetButton } from "../buttons/ResetSearchButton";
import Search from "../search";

interface AdminListHeaderProps {
  searchPlaceholder: string;
  /** Already resolved (`common.list.count`) — each admin page composes its
   * own singular/plural item name into it before handing it over. */
  countText: string;
  newItemHref: string;
  newItemLabel: string;
}

/**
 * The admin list page's header — search, result count, "new item" and reset
 * — extracted from six near-identical copies (TD-114). At 375px the
 * non-wrapping row shrank the search box to its icon and cut off "Nuovo
 * Incantesimo"; below `sm` the search field now takes its own row, with the
 * count/new-item/reset group wrapping onto a second.
 *
 * A sibling of `ListPage` (the public lists' equivalent container), kept
 * separate rather than merged into it: the admin header carries a "new item"
 * action `ListPage` has no use for, and takes an already-composed count
 * string instead of the raw `ItemCount` + item-name props `ListPage` builds
 * its own count from. Unifying the two is a design-system question
 * (TD-118's own note on public/admin layouts), not this fix.
 */
export default function AdminListHeader({
  searchPlaceholder,
  countText,
  newItemHref,
  newItemLabel,
}: AdminListHeaderProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-8 md:flex-nowrap">
      <div className="w-full sm:w-auto sm:flex-1">
        <Search placeholder={searchPlaceholder} />
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
        <div className="flex shrink-0" role="status">
          {countText}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <BaseButton to={newItemHref}>{newItemLabel}</BaseButton>
          <ResetButton />
        </div>
      </div>
    </div>
  );
}
