import fetchPlaceTree from "./fetchPlaceTree";
import { computeVisiblePlaces } from "./placeTree";

/**
 * The zones and landmarks a campaign's players may see (SPEC-022 §9): the
 * one helper every player read path asks, so inheritance is decided in one
 * place. One read of the tree per call.
 */
export default async function visiblePlaceIds(campaignId: number) {
  return computeVisiblePlaces(await fetchPlaceTree(), campaignId);
}
