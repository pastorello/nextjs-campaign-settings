/** A place's reveals, one row per campaign (SPEC-022 T6b). */
interface PlaceReveals {
  campaigns: {
    id: number;
    title: string;
    revealed: boolean;
    /**
     * The nearest ancestor not revealed to this campaign, which hides the
     * place whatever its own reveal says; null when nothing hides it.
     */
    hiddenBy: string | null;
  }[];
}

export default PlaceReveals;
