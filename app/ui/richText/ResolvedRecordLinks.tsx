import { ReactNode } from "react";

import fetchRecordLinkResolution from "@/app/lib/data/richText/fetchRecordLinkResolution";
import RecordLinkTargetsProvider from "./RecordLinkTargetsProvider";

/**
 * The server half of record-link resolution (SPEC-019 T5): resolves every
 * link in `values` in one batched read (`fetchRecordLinkResolution`) and
 * mounts `RecordLinkTargetsProvider` around `children`, so the formatted text
 * rendered below — in server or client components, and in the editors of any
 * form opened from there — links to the records that exist.
 *
 * `values` are the stored formatted-text values the page shows; pass every
 * one a form below may also open, so a deleted link loads unlinked there too.
 */
export default async function ResolvedRecordLinks({
  values,
  system,
  children,
}: {
  values: readonly (string | null | undefined)[];
  system: string;
  children: ReactNode;
}) {
  const { targets, deleted } = await fetchRecordLinkResolution(values, system);
  return (
    <RecordLinkTargetsProvider targets={targets} deleted={deleted}>
      {children}
    </RecordLinkTargetsProvider>
  );
}
