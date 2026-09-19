"use client";

import { ReactNode, useContext } from "react";

import type RecordLinkDomain from "@/app/lib/definitions/types/RecordLinkDomain";
import RecordLinkContext from "./RecordLinkContext";

/**
 * A record link inside a formatted description (SPEC-019 §5.4), rendered by
 * the nearest `RecordLinkTargetsProvider` — or as its text when there is none.
 */
export default function RecordLink({
  domain,
  id,
  children,
}: {
  domain: RecordLinkDomain;
  id: number;
  children: ReactNode;
}) {
  return <>{useContext(RecordLinkContext)(domain, id, children)}</>;
}
