"use client";

import { createContext, useContext, type ReactNode } from "react";

const ReadOnlyViewContext = createContext(false);

/**
 * Whether the dashboard is being read by a player (SPEC-022 T8b), set once
 * by the dashboard layout. A shared card that carries a DM's action, such
 * as assigning a location, renders without it under a read-only view. The
 * server refuses the action anyway; this keeps it from being offered.
 */
export function ReadOnlyViewProvider({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: ReactNode;
}) {
  return <ReadOnlyViewContext value={readOnly}>{children}</ReadOnlyViewContext>;
}

export function useReadOnlyView(): boolean {
  return useContext(ReadOnlyViewContext);
}
