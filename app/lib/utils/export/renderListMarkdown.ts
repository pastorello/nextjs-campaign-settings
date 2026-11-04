import listConfig from "@/app/lib/config/listConfig";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import renderRecordMarkdown, {
  RecordMarkdownInput,
} from "./renderRecordMarkdown";
import { escapeInline } from "./markdownText";

/**
 * A list's records as one Markdown document (SPEC-033 T1): each record as
 * `renderRecordMarkdown` writes it, separated by a rule. An empty list says
 * so, in the words its page uses.
 */
export default function renderListMarkdown({
  records,
  ...input
}: Omit<RecordMarkdownInput, "record"> & { records: ListItem[] }): string {
  if (records.length === 0) {
    return `${escapeInline(input.t(listConfig[input.pageType].emptyMessageKey))}\n`;
  }
  return `${records
    .map((record) => renderRecordMarkdown({ ...input, record }).trimEnd())
    .join("\n\n---\n\n")}\n`;
}
