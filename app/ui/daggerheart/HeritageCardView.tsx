import { useId, type ReactNode } from "react";

import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";
import RecordThumbnail from "../components/RecordThumbnail";

export interface HeritageFeature {
  name: string;
  /** The formatted text, already rendered. */
  text: ReactNode;
}

/**
 * An ancestry or a community laid out as a card (SPEC-027 §5.3), after
 * SPEC-021's domain card: the image and the name on a band, then the
 * features in order. `children` sit between the name and the features: a
 * community's adjectives and links. On screen only.
 *
 * An `article` named by its heading, so a screen reader can list and jump
 * between cards. No client state, so a client library and a server page
 * can both render it.
 */
export default function HeritageCardView({
  name,
  image,
  imageAlt,
  features,
  headingLevel = "h3",
  testId,
  children,
}: {
  name: string;
  image: RecordImageKeys | null | undefined;
  imageAlt: string;
  features: HeritageFeature[];
  /** The name's heading level, to fit the page it sits on. */
  headingLevel?: "h2" | "h3" | "h4";
  testId: string;
  children?: ReactNode;
}) {
  const headingId = useId();
  const Heading = headingLevel;

  return (
    <article
      aria-labelledby={headingId}
      data-testid={testId}
      className="flex min-h-72 w-full flex-col overflow-hidden rounded-xl border-4 border-slate-700 bg-white text-gray-900 shadow-md"
    >
      <div className="flex items-center gap-3 bg-slate-700 px-3 py-2 text-white">
        <RecordThumbnail image={image} name={imageAlt} />
        <Heading id={headingId} className="min-w-0 flex-1 text-lg font-bold">
          {name}
        </Heading>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 text-sm">
        {children}
        {features.map((feature, index) => (
          <section
            key={index}
            className="border-t border-gray-200 pt-2 first:border-t-0 first:pt-0"
          >
            <p className="font-semibold">{feature.name}</p>
            <div>{feature.text}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
