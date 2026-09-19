"use client";

import { createContext, ReactNode } from "react";

import type RecordLinkDomain from "@/app/lib/definitions/types/RecordLinkDomain";

/** Renders one record link's text as a link, or as the text alone. */
export type RenderRecordLink = (
  domain: RecordLinkDomain,
  id: number,
  children: ReactNode
) => ReactNode;

/**
 * How record links in formatted text render (SPEC-019 T2). The default — no
 * `RecordLinkTargetsProvider` above — renders every link as its text, the
 * same as a deleted target: never a guessed destination.
 *
 * Kept apart from the provider on purpose: `renderRichText` is imported by the
 * metadata layer (`pageMetaFields`), so nothing it reaches may import
 * next-intl's navigation; only the provider, mounted by a page, does.
 */
const RecordLinkContext = createContext<RenderRecordLink>(
  (_domain, _id, children) => children
);

export default RecordLinkContext;
