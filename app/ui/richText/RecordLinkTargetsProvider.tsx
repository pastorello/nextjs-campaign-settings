"use client";

import { ReactNode, useCallback } from "react";

import { Link } from "@/i18n/navigation";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import type RecordLinkTargets from "@/app/lib/definitions/types/RecordLinkTargets";
import recordLinkKey from "@/app/lib/utils/richText/recordLinkKey";
import recordHref from "@/app/lib/utils/search/recordHref";
import RecordLinkContext, { RenderRecordLink } from "./RecordLinkContext";

/**
 * Makes the record links in the formatted descriptions below it clickable
 * (SPEC-019 §5.4, ADR-0016). `targets` is what the page resolved server-side
 * with `fetchRecordLinkTargets`; the descriptions may render in client
 * components, hence a context rather than a prop.
 *
 * A resolved link leads where its search result does (`recordHref`), under
 * the current locale (next-intl's `Link`) and system, by the record's current
 * name. An unresolved one — deleted, or outside this system — is its text.
 */
export default function RecordLinkTargetsProvider({
  targets,
  children,
}: {
  targets: RecordLinkTargets;
  children: ReactNode;
}) {
  const system = useGameSystem();

  const renderRecordLink = useCallback<RenderRecordLink>(
    (domain, id, text) => {
      const name = targets[recordLinkKey(domain, id)];
      if (name === undefined) return text;
      return (
        <Link
          href={recordHref(system, domain, { id, name })}
          className="text-blue-600 hover:underline"
        >
          {text}
        </Link>
      );
    },
    [system, targets]
  );

  return (
    <RecordLinkContext.Provider value={renderRecordLink}>
      {children}
    </RecordLinkContext.Provider>
  );
}
