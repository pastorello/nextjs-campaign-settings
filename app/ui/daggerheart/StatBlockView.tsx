import { useId, type ReactNode } from "react";

import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";
import RecordThumbnail from "../components/RecordThumbnail";

/**
 * A GM-side stat block's frame (SPEC-028 §5.3): the image, the name and
 * the header line (tier and type) on a band, then the block's body. An
 * `article` named by its heading, so a screen reader can list and jump
 * between blocks. No client state, so a client library and a server page
 * can both render it. On screen only.
 */
export default function StatBlockView({
  name,
  headerLine,
  image,
  imageAlt,
  headingLevel = "h3",
  testId,
  children,
}: {
  name: string;
  headerLine: string;
  image: RecordImageKeys | null | undefined;
  imageAlt: string;
  /** The name's heading level, to fit the page it sits on. */
  headingLevel?: "h2" | "h3" | "h4";
  testId: string;
  children: ReactNode;
}) {
  const headingId = useId();
  const Heading = headingLevel;

  return (
    <article
      aria-labelledby={headingId}
      data-testid={testId}
      className="flex w-full flex-col overflow-hidden rounded-xl border-4 border-stone-800 bg-white text-gray-900 shadow-md"
    >
      <div className="flex items-center gap-3 bg-stone-800 px-3 py-2 text-white">
        <RecordThumbnail image={image} name={imageAlt} />
        <div className="min-w-0 flex-1">
          <Heading id={headingId} className="text-lg font-bold">
            {name}
          </Heading>
          <p className="text-sm">{headerLine}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 text-sm">{children}</div>
    </article>
  );
}

/** One labelled number in a stat block's numbers row. */
export function StatBlockNumber({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-semibold text-gray-700 uppercase">{label}</dt>
      <dd className="text-base font-bold">{value}</dd>
    </div>
  );
}
