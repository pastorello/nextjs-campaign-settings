import listConfig from "@/app/lib/config/listConfig";
import PageType from "@/app/lib/definitions/types/PageType";

// Loading animation
const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent";

export function CardSkeleton() {
  return (
    <div
      className={`${shimmer} relative overflow-hidden rounded-xl bg-gray-100 p-2 shadow-sm`}
    >
      <div className="flex p-4">
        <div className="h-5 w-5 rounded-md bg-gray-200" />
        <div className="ml-2 h-6 w-16 rounded-md bg-gray-200 text-sm font-medium" />
      </div>
      <div className="flex items-center justify-center truncate rounded-xl bg-white px-4 py-8">
        <div className="h-7 w-20 rounded-md bg-gray-200" />
      </div>
    </div>
  );
}

export function CardsSkeleton() {
  return (
    <>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </>
  );
}

export default function DashboardSkeleton() {
  return (
    <>
      <div
        className={`${shimmer} relative mb-4 h-8 w-36 overflow-hidden rounded-md bg-gray-100`}
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </>
  );
}

/** How many cells a row of the real table has: name + columns + actions. */
const columnCount = (pageType?: PageType) =>
  pageType ? listConfig[pageType].columns.length + 2 : 4;

export function TableRowSkeleton({
  pageType,
}: {
  pageType?: PageType | undefined;
}) {
  const cells = columnCount(pageType);

  return (
    <tr className="w-full border-b border-gray-100 last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
      <td className="relative overflow-hidden whitespace-nowrap py-3 pl-6 pr-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-32 rounded bg-gray-100"></div>
        </div>
      </td>

      {Array.from({ length: cells - 2 }, (_, index) => (
        <td key={index} className="whitespace-nowrap px-3 py-3">
          <div className="h-6 w-24 rounded bg-gray-100"></div>
        </td>
      ))}

      <td className="whitespace-nowrap py-3 pl-6 pr-3">
        <div className="flex justify-end gap-3">
          <div className="h-9.5 w-9.5 rounded bg-gray-100"></div>
          <div className="h-9.5 w-9.5 rounded bg-gray-100"></div>
        </div>
      </td>
    </tr>
  );
}

/**
 * The placeholder shown while an `EntityList` streams in.
 *
 * **`aria-hidden`, and no text.** This used to be the Next.js Learn tutorial's
 * invoices table, headed *Customer · Email · Amount · Date · Status · Edit* —
 * literal strings, in the accessibility tree, announced by a screen reader on a
 * page of spells. A loading placeholder has nothing to tell assistive
 * technology: the real table follows and says it properly. It is decorative, so
 * it is now hidden and its headers are shimmer blocks rather than words.
 *
 * Hiding it also stops it interfering with queries: a `getByRole("columnheader")`
 * during streaming used to find the tutorial's six headers instead of the real
 * ones, which is exactly how this was noticed.
 *
 * **`pageType` makes the shape right.** Without it the placeholder rendered six
 * columns for every domain — against the spells table's four, the layout jumped
 * as soon as the data arrived. The count comes from `listConfig`, so it stays
 * correct as columns change.
 */
export function TableSkeleton({
  pageType,
}: {
  pageType?: PageType | undefined;
}) {
  const cells = columnCount(pageType);

  return (
    <div className="mt-6 flow-root" aria-hidden="true">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                {Array.from({ length: cells }, (_, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-4 py-5 font-medium sm:pl-6"
                  >
                    <div className="h-6 w-20 rounded bg-gray-200"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.from({ length: 6 }, (_, index) => (
                <TableRowSkeleton key={index} pageType={pageType} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * The placeholder for a card library — the public list pages (TD-30).
 *
 * Those pages render full-width cards, not a table, and used to fall back to
 * `TableSkeleton`. It never showed, because nothing inside their boundary
 * suspended, so the mismatch went unnoticed.
 *
 * `aria-hidden` for the same reason as `TableSkeleton`: a placeholder has
 * nothing to announce.
 */
export function LibrarySkeleton() {
  return (
    <div className="w-full pt-5" aria-hidden="true">
      <div className="mb-4 h-10 w-full rounded bg-gray-100" />
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className={`${shimmer} relative my-2 h-14 w-full overflow-hidden rounded-xl bg-gray-100`}
        />
      ))}
    </div>
  );
}
