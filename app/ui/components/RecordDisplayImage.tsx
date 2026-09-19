import Image from "next/image";

import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";
import { recordImageUrl } from "@/app/lib/utils/images/recordImageUrls";

/**
 * A record's image at display size (longest side up to 1600 px) in its
 * card's detail panel (SPEC-020 T4), with the record's name as the text
 * alternative. Nothing at all when the record has none — the detail view
 * has no row to keep aligned, so a placeholder would only be noise.
 *
 * `unoptimized` for the same reason as `RecordThumbnail`: the route is
 * authenticated, which Next's optimizer cannot pass. The stored width and
 * height give the `<img>` its aspect ratio up front, so the panel does not
 * jump when the bytes land; CSS then scales it down to fit.
 */
export default function RecordDisplayImage(props: {
  image: RecordImageKeys | null | undefined;
  name: string;
}) {
  if (!props.image) return null;

  return (
    <Image
      src={recordImageUrl(props.image.displayKey)}
      alt={props.name}
      width={props.image.width}
      height={props.image.height}
      unoptimized
      className="h-auto max-h-96 w-auto max-w-full rounded-lg object-contain"
    />
  );
}
