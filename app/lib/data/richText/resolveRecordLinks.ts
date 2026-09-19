"use server";

import { z } from "zod";

import requireSession from "@/app/lib/auth/requireSession";
import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import type RecordLinkResolution from "@/app/lib/definitions/types/RecordLinkResolution";

import fetchRecordLinkResolution from "./fetchRecordLinkResolution";

/** Bounds, not product rules: a popover or panel shows one or two values. */
const MAX_VALUES = 20;
const MAX_VALUE_LENGTH = 100_000;

const inputSchema = z.object({
  values: z.array(z.string().max(MAX_VALUE_LENGTH).nullable()).max(MAX_VALUES),
  system: z.string().refine(isGameSystem),
});

/**
 * `fetchRecordLinkResolution` for a client component whose formatted text is
 * loaded client-side — the map's place popover and edit panels (SPEC-019 T5),
 * where no Server Component holds the description to resolve up front.
 *
 * A Server Action, so it checks the session itself (the proxy does not cover
 * actions, as in `searchRecordLinks`) and validates what the client sends.
 * Read-only.
 */
export default async function resolveRecordLinks(
  values: (string | null)[],
  system: string
): Promise<RecordLinkResolution> {
  await requireSession();
  const input = inputSchema.parse({ values, system });
  return fetchRecordLinkResolution(input.values, input.system);
}
