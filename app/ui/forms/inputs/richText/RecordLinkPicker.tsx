"use client";

import { Dispatch, SetStateAction, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";

import Modal from "@/app/ui/components/Modal";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import searchRecordLinks from "@/app/lib/data/search/searchRecordLinks";
import type { SearchAllDomainsResult } from "@/app/lib/data/search/searchAllDomains";
import { RECORD_LINK_DOMAINS } from "@/app/lib/definitions/types/RecordLinkDomain";
import isValidString from "@/app/lib/utils/validators/isValidString";

import type { RecordLinkAttributes } from "./recordLinkMark";

/** Same wait as the list pages' search box (`app/ui/search.tsx`). */
const SEARCH_DEBOUNCE_MS = 300;

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; term: string; result: SearchAllDomainsResult };

interface RecordLinkPickerProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onChoose: (link: RecordLinkAttributes) => void;
}

/**
 * The record-link picker (SPEC-019 §5.3, T4): a dialog with a search box
 * running SPEC-011's cross-entity search (through `searchRecordLinks`, under
 * the route's game system), results grouped by domain in the search page's
 * order. Choosing a result hands its domain and id to the editor, which links
 * the selection. Keyboard: the search box, first in the dialog, has focus on open, Tab reaches each
 * result, Enter chooses, Escape closes.
 */
export default function RecordLinkPicker({
  isOpen,
  setIsOpen,
  onChoose,
}: RecordLinkPickerProps) {
  const t = useTranslations("common.richText.linkPicker");
  const tDomain = useTranslations("common.cards");
  const system = useGameSystem();
  const inputId = useId();
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  // Only the latest request may land: an older, slower one is dropped.
  const latestRequest = useRef(0);

  const runSearch = useDebouncedCallback(async (term: string) => {
    const request = ++latestRequest.current;
    if (!isValidString(term.trim())) {
      setSearch({ status: "idle" });
      return;
    }
    setSearch({ status: "loading" });
    try {
      const result = await searchRecordLinks(term, system);
      if (request === latestRequest.current) {
        setSearch({ status: "done", term, result });
      }
    } catch {
      if (request === latestRequest.current) setSearch({ status: "error" });
    }
  }, SEARCH_DEBOUNCE_MS);

  const groups =
    search.status === "done"
      ? RECORD_LINK_DOMAINS.map((domain) => ({
          domain,
          items: search.result[domain].items,
        })).filter(({ items }) => items.length > 0)
      : [];

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={t("title")}
      size="small"
    >
      <div className="w-80 space-y-3">
        <label htmlFor={inputId} className="block text-sm font-medium">
          {t("searchLabel")}
        </label>
        <input
          id={inputId}
          type="search"
          autoComplete="off"
          onChange={(event) => void runSearch(event.target.value)}
          className="w-full rounded-md border px-2 py-1"
        />
        <div aria-live="polite" className="text-sm text-gray-600">
          {search.status === "idle" && t("prompt")}
          {search.status === "loading" && t("searching")}
          {search.status === "error" && t("error")}
          {search.status === "done" &&
            groups.length === 0 &&
            t("noMatches", { term: search.term })}
        </div>
        {groups.map(({ domain, items }) => (
          <section key={domain} aria-labelledby={`${inputId}-${domain}`}>
            <h3
              id={`${inputId}-${domain}`}
              className="text-xs font-semibold text-gray-500 uppercase"
            >
              {tDomain(domain)}
            </h3>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onChoose({ domain, id: item.id })}
                    className="w-full rounded px-2 py-1 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
