import { describePageMetaInvariants } from "./pageMetaInvariants.testkit";
import pageMetaFields from "./pageMetaFields";

// The three fields common to every domain, declared directly on this file
// rather than in a per-domain meta object — the rest of pageMetaFields is
// already exercised through the domain suites it aggregates.
describePageMetaInvariants("pageMetaFields (base fields)", {
  id: pageMetaFields.id,
  name: pageMetaFields.name,
  description: pageMetaFields.description,
});
