import { ReactNode } from "react";

import pagesConfig from "@/app/lib/config/pagesConfig";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import PageType from "@/app/lib/definitions/types/PageType";
import ControlType from "@/app/lib/definitions/types/ControlType";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import type OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import type {
  MetaDisplayValue,
  OptionTableName,
} from "@/app/lib/definitions/interfaces/meta/PageMeta";
import resolveFieldValue from "../data/resolveFieldValue";
import htmlToMarkdown, { plainTextToMarkdown } from "./htmlToMarkdown";
import { escapeInline } from "./markdownText";

// A translator, as returned by next-intl's `getTranslations`.
type Translator = (key: string) => string;

/**
 * The fields a reveal reads its campaigns from. Campaigns are campaign
 * material and a reveal is about who sees what: both stay out of an export
 * (SPEC-033 §3).
 */
const CAMPAIGN_TABLES: ReadonlySet<OptionTableName> = new Set([
  "campaign",
  "dnd5eCampaign",
]);

/** The id names nothing outside the install; the name is the title. */
const NOT_A_FIELD: ReadonlySet<string> = new Set(["id", "name"]);

/**
 * The fields of a record's Markdown, in its page's order (`pagesConfig`) —
 * so a field added to a page is exported with no change here (SPEC-033 §5.3).
 * The image is left out: it travels as a file in the setting's archive (T3).
 */
export function markdownFields(pageType: PageType): string[] {
  return pagesConfig[pageType].fields.filter((key) => {
    const meta = fieldMeta[key];
    if (meta === undefined || NOT_A_FIELD.has(key)) return false;
    if (meta.controlType === ControlType.Image) return false;
    return (
      meta.optionTable === undefined || !CAMPAIGN_TABLES.has(meta.optionTable)
    );
  });
}

/** A record's name, its title in every export. */
export const recordName = (record: ListItem): string =>
  typeof record.name === "string" ? record.name.trim() : "";

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

/**
 * A field's display value as text. Every non-formatted `getDatum` returns
 * text or a number today; one returning an element would print as
 * `[object Object]`, so it fails loudly instead — the test over every page
 * is where it would surface first.
 */
function toText(node: ReactNode, key: string): string {
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "boolean") {
    return String(node);
  }
  throw new Error(`Export: the field "${key}" does not display as text`);
}

export interface RecordMarkdownInput {
  pageType: PageType;
  record: ListItem;
  /** Resolves labels and option values in the DM's locale. */
  t: Translator;
  /** The page's table-backed options (`fetchOptionBundle`). */
  bundle?: OptionBundle | undefined;
}

/**
 * One record as a readable Markdown document (SPEC-033 T1): the name as the
 * title, then each field in page order, labelled from the catalogues.
 * Short values are a list of `**Label:** value` lines; formatted and long
 * plain-text fields are a labelled block of their own. Option-backed values
 * resolve to their labels, as on the record's page; an empty field is left
 * out. `dmOnly` fields are included — only the DM exports.
 */
export default function renderRecordMarkdown({
  pageType,
  record,
  t,
  bundle,
}: RecordMarkdownInput): string {
  const blocks = [`# ${escapeInline(recordName(record))}`];
  let facts: string[] = [];
  const flushFacts = () => {
    if (facts.length > 0) blocks.push(facts.join("\n"));
    facts = [];
  };

  for (const key of markdownFields(pageType)) {
    const meta = fieldMeta[key];
    const value = record[key];
    if (meta === undefined || isEmpty(value)) continue;
    const label = escapeInline(t(meta.labelKey ?? key));

    if (
      meta.controlType === ControlType.RichText ||
      meta.controlType === ControlType.Textarea
    ) {
      const text = String(value);
      const body =
        meta.controlType === ControlType.RichText
          ? htmlToMarkdown(text)
          : plainTextToMarkdown(text);
      if (body === "") continue;
      flushFacts();
      blocks.push(`**${label}**`, body);
      continue;
    }

    const text = toText(
      resolveFieldValue(meta, value as MetaDisplayValue, t, false, bundle),
      key
    )
      .replace(/\s+/g, " ")
      .trim();
    if (text !== "") facts.push(`- **${label}:** ${escapeInline(text)}`);
  }
  flushFacts();

  return `${blocks.join("\n\n")}\n`;
}
