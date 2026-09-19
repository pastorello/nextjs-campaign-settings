import Image from "next/image";
import { PhotoIcon } from "@heroicons/react/24/outline";

import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";
import { recordImageUrl } from "@/app/lib/utils/images/recordImageUrls";

const SIZES = {
  sm: { px: 40, className: "h-10 w-10" },
  md: { px: 56, className: "h-14 w-14" },
} as const;

/**
 * A record's thumbnail in a list row or a card's header (SPEC-020 T4), or a
 * neutral placeholder when the record has no image — so rows with and
 * without one line up.
 *
 * `unoptimized`, so this renders a plain `<img>` pointed straight at the
 * authenticated same-origin route: Next's optimizer would fetch the image
 * server-side without the viewer's session cookie and get a 401, and the
 * upload pipeline has already sized the thumbnail (256 px square) anyway.
 * `width`/`height` reserve the box before the bytes arrive; `lazy` because
 * a page of rows should not fetch images far below the fold.
 *
 * The record's name is the alternative text (§8 "every image has a text
 * alternative"). Callers keep it outside any button or link, so it never
 * joins a control's accessible name.
 */
export default function RecordThumbnail(props: {
  image: RecordImageKeys | null | undefined;
  name: string;
  size?: keyof typeof SIZES;
}) {
  const size = SIZES[props.size ?? "sm"];

  if (!props.image) {
    return (
      <div
        data-testid="record-thumbnail-placeholder"
        aria-hidden="true"
        className={`${size.className} flex shrink-0 items-center justify-center rounded-md bg-gray-500/20 text-gray-400`}
      >
        <PhotoIcon className="h-1/2 w-1/2" />
      </div>
    );
  }

  return (
    <Image
      src={recordImageUrl(props.image.thumbKey)}
      alt={props.name}
      width={size.px}
      height={size.px}
      loading="lazy"
      unoptimized
      className={`${size.className} shrink-0 rounded-md object-cover`}
    />
  );
}
