import { OptionTableName } from "@/app/lib/definitions/interfaces/meta/PageMeta";
import { ResolvedOption } from "./SelectOption";

/**
 * Every table-backed field's resolved options, for one request. Resolved on
 * the server and passed down as a prop (SPEC-006 §7, decision 10) — there is
 * exactly one table today, but the shape stays a record so a second one is
 * additive rather than a signature change.
 */
type OptionBundle = Partial<Record<OptionTableName, ResolvedOption<number>[]>>;

export default OptionBundle;
