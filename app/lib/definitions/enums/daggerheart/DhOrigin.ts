/**
 * Where a Daggerheart record came from (SPEC-018 §6, SPEC-021 §6): the DM's
 * own material, or a reference copy of SRD content kept for private play.
 * Every Daggerheart catalogue table stores it as a raw `String`, defaulting to
 * `homebrew`; a future export needs it to state what was modified (DPCGL
 * §4.1(e)).
 */
enum DhOrigin {
  Homebrew = "homebrew",
  SrdReference = "srdReference",
}

export default DhOrigin;
