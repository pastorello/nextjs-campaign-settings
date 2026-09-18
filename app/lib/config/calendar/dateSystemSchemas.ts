import { z } from "zod";

import dateSystemMeta from "./dateSystemMeta";

/**
 * The date system actions' payload schemas, built from `dateSystemMeta`'s
 * own validators field by field rather than through
 * `buildBespokeCreateSchema`, whose runtime field list widens the output to
 * `Record<string, unknown>`. Spelled out, the parsed data is typed as the
 * DB write needs it, with no assertion to narrow it back (TD-122's concern
 * — write only what was parsed — holds either way).
 */
export const universalDateSystemSchema = z.object({
  name: dateSystemMeta.name.validator,
  afterLabel: dateSystemMeta.afterLabel.validator,
  afterAbbrev: dateSystemMeta.afterAbbrev.validator,
  monthNames: dateSystemMeta.monthNames.validator,
  weekdayNames: dateSystemMeta.weekdayNames.validator,
});

/** Every field of one of the DM's own systems (SPEC-014 §5.2). */
export const dateSystemSchema = universalDateSystemSchema.extend({
  anchorEvent: dateSystemMeta.anchorEvent.validator,
  anchorYear: dateSystemMeta.anchorYear.validator,
  beforeLabel: dateSystemMeta.beforeLabel.validator,
  beforeAbbrev: dateSystemMeta.beforeAbbrev.validator,
});
