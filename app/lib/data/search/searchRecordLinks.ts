"use server";

import { z } from "zod";

import requireSession from "@/app/lib/auth/requireSession";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import searchAllDomains, {
  type SearchAllDomainsResult,
} from "./searchAllDomains";

/** Longer than any record name; a bound, not a product rule. */
const MAX_TERM_LENGTH = 200;

const inputSchema = z.object({
  term: z.string().trim().max(MAX_TERM_LENGTH),
  system: z.string().refine(isGameSystem),
});

/**
 * The formatted-text editor's record-link picker search (SPEC-019 T4): the
 * SPEC-011 cross-entity search, reached from a client component. A Server
 * Action, so it checks the session itself — the proxy does not cover actions
 * (the same reason `fetchLinkableEntities` does) — and validates what the
 * client sends. The system is the route's, so a catalogue outside it is not
 * offered, exactly as on the search page (ADR-0013 rule 10).
 */
export default async function searchRecordLinks(
  term: string,
  system: string
): Promise<SearchAllDomainsResult> {
  await requireSession();
  const input = inputSchema.parse({ term, system });
  return searchAllDomains(input.term, input.system);
}
