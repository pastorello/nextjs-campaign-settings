"use client";

import { createContext } from "react";

/**
 * The `recordLinkKey`s of links on this page whose record was deleted
 * (SPEC-019 T5), set by `RecordLinkTargetsProvider`. The formatted-text editor
 * opens those links unlinked (§5 edge cases); with no provider above it the
 * set is empty and every link opens as stored — never a guessed deletion.
 */
const DeletedRecordLinksContext = createContext<ReadonlySet<string>>(new Set());

export default DeletedRecordLinksContext;
