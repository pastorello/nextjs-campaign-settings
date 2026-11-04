import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import requireApiDm from "@/app/lib/auth/requireApiDm";
import parseIdParam from "@/app/lib/data/validation/parseIdParam";
import toErrorResponse from "@/app/lib/errors/toErrorResponse";
import PageType from "@/app/lib/definitions/types/PageType";
import fetchAllListItems from "@/app/lib/data/export/fetchAllListItems";
import fetchOptionBundle from "@/app/lib/data/options/fetchOptionBundle";
import renderRecordMarkdown, {
  recordName,
} from "@/app/lib/utils/export/renderRecordMarkdown";
import renderListMarkdown from "@/app/lib/utils/export/renderListMarkdown";
import slugify from "@/app/lib/utils/export/slugify";

const PAGE_TYPES: ReadonlySet<string> = new Set(Object.values(PageType));
const isPageType = (value: string): value is PageType => PAGE_TYPES.has(value);

const markdownFile = (body: string, baseName: string) =>
  new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // `baseName` is a slug or a page type: ASCII, no quote to escape.
      "Content-Disposition": `attachment; filename="${baseName}.md"`,
      "Cache-Control": "no-store",
    },
  });

/**
 * A domain's records as Markdown (SPEC-033 T1), DM only: the list under the
 * filter its query string carries — the admin list's own search params — or,
 * with `id`, that one record. `locale` picks the catalogue the labels and
 * option values are written in; it defaults like the app does.
 *
 * Read through the list's reader in both cases (`fetchAllListItems`), so a
 * record exports exactly as its list shows it.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ pageType: string }> }
) {
  const unauthorized = await requireApiDm();
  if (unauthorized) return unauthorized;

  const { pageType } = await context.params;
  if (!isPageType(pageType)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { locale: requestedLocale, ...filter } = Object.fromEntries(
    new URL(request.url).searchParams
  );
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  let id: number | undefined;
  if (filter.id !== undefined) {
    const parsed = parseIdParam(filter.id);
    if (parsed instanceof NextResponse) return parsed;
    id = parsed;
  }

  try {
    const [records, bundle, t] = await Promise.all([
      fetchAllListItems(pageType, filter),
      fetchOptionBundle(pageType),
      getTranslations({ locale }),
    ]);

    if (id === undefined) {
      return markdownFile(
        renderListMarkdown({ pageType, records, t, bundle }),
        pageType
      );
    }

    // Checked here as well as filtered by the query: a reader that dropped
    // the id filter must not turn one record's export into the whole list.
    const record = records.find((row) => row.id === id);
    if (record === undefined) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return markdownFile(
      renderRecordMarkdown({ pageType, record, t, bundle }),
      slugify(recordName(record), `${pageType}-${id}`)
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
