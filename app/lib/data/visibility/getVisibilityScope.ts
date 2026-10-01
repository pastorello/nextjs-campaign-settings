import { cache } from "react";

import getViewer from "@/app/lib/auth/getViewer";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";

import type VisibilityScope from "./VisibilityScope";
import visiblePlaceIds from "./visiblePlaceIds";

/**
 * The reader's scope, for a read path a player may reach (SPEC-022 T7).
 * Throws `UnauthorizedError` without a session. For a player it computes the
 * visible places once per request (cached), whichever paths ask.
 */
const getVisibilityScope = cache(async (): Promise<VisibilityScope> => {
  const viewer = await getViewer();
  if (!viewer) throw new UnauthorizedError();
  if (viewer.kind === "dm") return { kind: "all" };
  if (!viewer.campaign) {
    return {
      kind: "campaign",
      campaignId: null,
      zones: new Set(),
      pois: new Set(),
    };
  }
  return {
    kind: "campaign",
    campaignId: viewer.campaign.id,
    ...(await visiblePlaceIds(viewer.campaign.id)),
  };
});

export default getVisibilityScope;
