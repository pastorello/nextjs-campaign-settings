# Licensing — one world under three rule sets

- **Status:** Analysis, 2026-09-11
- **Scope:** whether the app can support D&D 5e, Pathfinder Second Edition and Daggerheart at once, with shared world sections and custom-only rules catalogues, under each publisher's licence
- **Related:** [SPEC-018](../specs/018-game-systems.md), [SPEC-012](../specs/012-publishing-and-internet-exposure.md), [`README.md`](./README.md) (the mechanics-not-text rule)
- **Versions checked:** SRD 5.1 and SRD 5.2.1 (CC-BY-4.0); ORC License (Library of Congress TX 9-307-067); Paizo Fan Content Policy 1.0 and Compatibility License (2024-07-22), Community Use Policy (2024-08-22); DPCGL 2.0 (text "Last Updated 8/05/2026", published 2026-08-26); Daggerheart SRD 2.0 (2026-08-25)

These are readings of the licence texts by a developer, not legal advice. Re-check the texts before any publication, and before any change to who can log in.

---

## 1. Short answer

**Yes, the plan is possible under all three licences, and the way it is framed — shared world, custom-only catalogues, structure in the public repo and content in the private database — is the framing that makes it possible.** The three publishers are very different in how open they are, and the plan works because it never depends on the least open one.

Ranked from most to least permissive:

| System            | Licence                                   | Software / web app allowed?                                             | Commercial?               | Can the public repo ship rules content?                                                  |
| ----------------- | ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| **D&D 5e**        | SRD 5.1 / 5.2.1 under CC-BY-4.0           | Yes — any medium                                                        | Yes                       | Yes, with the attribution statement (§3)                                                 |
| **Pathfinder 2e** | ORC License (Remaster) / OGL 1.0a (older) | Yes — "all media and formats whether now known or hereafter created"    | Yes                       | Yes, with an ORC Notice; the game content you add becomes ORC Licensed Material too (§4) |
| **Daggerheart**   | DPCGL 2.0                                 | **No** — a web app is not a Permitted Format; only whitelisted VTTs are | Only in Permitted Formats | **No** — SRD content in a repo would be Sharing outside a Permitted Format (§5)          |

The three things the app must keep apart are:

1. **The world** — geography, religion, known characters, factions. This is the DM's own creation and no publisher licence touches it. It is shared across systems precisely because it belongs to nobody but the DM.
2. **Rules structure** — the shape of a spell, a domain card, a magic item: fields, ranges, enumerations, tiers. Game mechanics and terminology are not protected by copyright (in the US, in the EU and in Italy alike — copyright protects the expression, not the rules of a game), so structure can live in the public repository regardless of licence. The licences below only matter once protected _expression_ is copied.
3. **Rules instances** — a specific spell text, a stat block, a class write-up. This is where the licences apply. The plan's "custom only" rule means the app ships none, so the licences constrain only what the DM chooses to enter and what is ever exported.

The rest of this document says, per system, what each licence allows, and what the current repository already does that needs attention (§6).

---

## 2. The three situations the app is in

Every licence question here resolves to one of three situations, and they have different answers.

**Private use.** The app runs self-hosted, behind login, for one DM's own table. Nothing is distributed. Under every one of the three licences this is outside the licence entirely: the DPCGL says so explicitly (§1.8: "public" does not include "private, non-commercial play among friends, family, or gaming groups in a personal setting (in-person or online)"), and CC-BY and ORC only govern _distribution_ in the first place. The DM may keep rulebook text of any system in the private database for their own use, as they already do with the Italian 5e spell descriptions. **This holds only as long as the audience is closed** — see SPEC-012 in §6.

**The public repository.** The code on GitHub is distributed. What it contains is what the licences are checked against. The rule already written in [`README.md`](./README.md) — mechanics restated, never text — keeps it clear of all three, because it ships no protected expression. Two additions from this analysis: it also must not ship _translated_ rulebook text (§6, seed data), and the words "Daggerheart" and "Pathfinder" may appear as system labels but never in the app's or repository's name (§4, §5).

**Publication of the DM's content.** If the DM one day exports and shares homebrew (SPEC-018 §3 keeps this out of scope), the licence of the _system the content is for_ applies, in full: attribution statements, format limits, and for Daggerheart the release-of-claims clause. Each system's section below ends with what that would require, so the export spec can be written against it.

---

## 3. D&D 5e — SRD 5.1 and 5.2.1 under Creative Commons

**What is licensed.** Wizards of the Coast publishes two System Reference Documents under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode): [SRD 5.1](https://www.dndbeyond.com/srd) (2014 rules) and [SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf) (2024 rules). Wizards' own [SRD page](https://www.dndbeyond.com/srd) says the content "can be used in any creative expressions, like TTRPGs and VTTs", and that a CC-BY release "is permanently available under those terms" — it cannot be withdrawn the way the OGL was threatened in 2023. CC-BY-4.0 allows copying, modification and commercial use in any medium, including software and databases, on one condition: attribution.

**Official Italian SRDs exist.** Both SRD 5.1 and SRD 5.2.1 are published by Wizards in Italian under the same CC-BY-4.0 licence ([Italiano SRD v5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/IT_SRD_CC_v5.2.1.pdf); the 5.1 Italian CC version is linked from the same page). This matters for a bilingual app whose DM writes in Italian: the CC licence covers the _Italian SRD text_, not the Italian _Player's Handbook_ text, and the two are different translations of overlapping content (§6).

**The attribution statement.** The SRD 5.2.1 legal page requires this exact text wherever SRD material is used, and asks for no other attribution to Wizards:

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

The SRD 5.1 statement is the same with "5.1" in place of "5.2.1". If the repository ever ships SRD material (seed data, fixtures, an import of the SRD spell list), this statement goes in a `LICENSES/` or `NOTICE` file and in the app's about/credits view.

**Trademarks are not licensed.** CC-BY-4.0 §2(b)(2) excludes trademark rights, so "Dungeons & Dragons", "D&D" and "Wizards of the Coast" are not granted. The SRD 5.2.1 legal page says what may be said instead: **"compatible with fifth edition" or "5E compatible"**. Naming the system "D&D 5e" inside a settings switch is descriptive reference and is fine; putting "D&D" in the app's name or in a published product's title is not.

**What is not in the SRD.** The SRD is a subset of the core rules. Excluded by design: some classes (Artificer), species (Aasimar), monsters tied to the brand (Beholder, Mind Flayer, and the like), setting names and characters (Forgotten Realms, Strahd, Orcus, Tiamat), and every spell, item or subclass that appears only in the full books. Anything outside the SRD is ordinary Wizards copyright and is available only for private use.

**For the app.** 5e is the least constrained of the three. The "custom only" rule is not required by this licence — the app _could_ ship the whole SRD spell list — so it is a product choice, and a good one: it keeps one rule for all three systems, and the DM's real library already lives in the database. If the export feature ever ships 5e homebrew that quotes SRD text, add the attribution statement to the export and nothing else is needed.

---

## 4. Pathfinder Second Edition — ORC (Remaster) and OGL 1.0a (pre-Remaster)

Paizo has the most licences of the three publishers, and the [licences page](https://paizo.com/licenses) routes each use case to one of them. The ones that matter here:

**ORC License — for rules content.** Since November 2023 Paizo's Remaster core line (_Player Core_, _GM Core_, _Monster Core_, _Player Core 2_) is released under the [Open RPG Creative License](https://paizo.com/orclicense), an irrevocable, publisher-independent licence registered with the Library of Congress. Under §I.e the **Licensed Material** is the game mechanics — "character creation systems, rules, combat mechanics, spells, statblocks, and methods of play", plus the expression "reasonably necessary to convey" them. **Reserved Material** (§I.h) is everything that could be changed without changing the game: trademarks, named characters, world lore (Golarion, the Lost Omens setting), storylines, art and maps — and, relevant to a deities section, Paizo's named deities. The grant (§II.a) is royalty-free, commercial, "in all media and formats whether now known or hereafter created" — software included. The cost is **share-alike** (§II.b): whatever game content you build on ORC material must be offered back under ORC. Source code is not Licensed Material; only the game content it implements is. Pre-Remaster books remain under OGL 1.0a, which is the same shape with Product Identity in place of Reserved Material.

**The ORC Notice.** Three parts are required (§III): the ORC Notice ("This product is licensed under the ORC License located at the Library of Congress at TX 9-307-067 and available online at various locations …" — copy the full paragraph from §III.a of the licence text), an Attribution Notice crediting each upstream source (Paizo's own notice line for _Player Core_ etc.), and a Reserved Material notice for what you keep proprietary.

**Community Use Policy and Fan Content Policy — for fan works that use Paizo IP.** Paizo's licences page lists both as current. The [Community Use Policy](https://paizo.com/licenses/communityuse) (updated 2024-08-22) is for "non-commercial, freely available content" and explicitly names "websites, podcasts, software, and other extensions" of Paizo's products; it requires everything to be free and accessible by everyone, allows donations and ad revenue, and requires the notice _"[Project name] uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (paizo.com/licenses/communityuse)."_ The [Fan Content Policy](https://paizo.com/licenses/fancontent) 1.0 (2024-07-22) is for "non-RPG products" that may be monetized in limited ways — streams, videos, hand-made merchandise, "non-ORC/OGL websites" — with its own notice. The limit that matters for a tool is written in the Fan Content Policy: it does **not** cover "RPG products, character generators, or rules compendiums" — for those, "you'll need to use the ORC/OGL, Compatibility License, or Pathfinder and Starfinder Infinite". So a public tool that _displays Paizo's rules_ is an ORC product, not fan content; a tool that stores the DM's own homebrew is neither, and only references the trademark descriptively — if it were ever made freely available to others, the Community Use Policy notice is the one to carry.

**Compatibility License — for the logo.** The [Paizo Compatibility License](https://paizo.com/licenses/compatibility) (2024-07-22, no registration required) licenses the "Pathfinder Second Edition Compatible" logo and the _Pathfinder-Icons_ font for products "fully compatible with" the game. It requires the full product name ("Pathfinder Second Edition", never "PF2e") and this notice: _"Compatibility with Pathfinder Second Edition requires Pathfinder Second Edition from Paizo Inc. See paizo.com/pathfinder to learn more about Pathfinder. Paizo Inc. does not guarantee compatibility, and does not endorse this product."_ It forbids Paizo trademarks in the product title and setting content from Lost Omens.

**Pathfinder Infinite — the walled garden.** Community content sold through Paizo's own storefront gets access to Golarion, but such products may not be released under ORC/OGL, and since September 2024 no new OGL content is accepted there. Irrelevant to a self-hosted tool; relevant if the DM ever wanted to sell PF2 homebrew set in the DM's own world (ORC or Compatibility route) versus in Golarion (Infinite only).

**For the app.** Private use of anything is fine. The public repository may hold PF2 _structure_ (traits, rarity, action costs, levels 1–20 — mechanics, and unprotected); it may hold PF2 _content_ only with an ORC Notice and with the share-alike consequence for the DM's own game content. The custom-only rule avoids that entirely, so the recommendation is the same as for 5e: no seeded PF2 content, the ORC only enters the picture at export time. Naming the system "Pathfinder 2e" in the switch is descriptive; "Pathfinder" must not be in the app's name, and the Compatibility License logo is only worth adopting for a published product.

The Italian community wiki the plan cites, [Golarion Insider](https://pf2.altervista.org/wiki/Pagina_principale), states that it accepts content only under the Community Use Policy and the OGL. It is a useful reference for Italian terminology, but its pages are not a licence source for this project: text there is either Paizo's (licensed to _them_ as fan content) or the volunteers' own.

---

## 5. Daggerheart — Darrington Press Community Gaming License 2.0

This is the licence that shapes the whole plan, and SPEC-018 §5 already carries the binding reading. This section confirms it against the current text and adds what the spec did not need.

**What is licensed, and to whom.** The [DPCGL](https://darringtonpress.com/license/) — current text [DPCGL 2.0, published 2026-08-26, "Last Updated 8/05/2026"](https://darringtonpress.com/wp-content/uploads/2026/08/DPCGL_2.0_AUG_26_2026.pdf) — designates the [Daggerheart SRD](https://www.daggerheart.com/srd/) 1.0 and 2.0 (2.0 dated 2026-08-25, adding the _Hope & Fear_ classes and transformations) and the Domain Icons as **Public Game Content** (§1.6). The grant (§2.1) is: (a) reproduce and Share the Public Game Content; (b) produce, Share and sell **Adaptive Content** — "content that is derived from or is based on Public Game Content or in which the Public Game Content is translated, altered, rearranged, transformed, or otherwise modified" (§1.7) — **"solely in the Permitted Formats"**.

**Permitted Formats (§1.9) are a closed list:** (a) physical print and digital print — supplements, manuals, books, stories, novels, cards; (b) live-streaming and video; (c) podcasts; (d) VTTs "expressly approved by DRP and listed in Section 1.9.1" — Roll20, Demiplane, Foundry, Alchemy, Fantasy Grounds as of the July 2025 list. **A web application, a database, a self-hosted tool or a GitHub repository is not on it.** DRP's FAQ invites requests to add VTTs to the whitelist; a bespoke tool would need written permission.

**Sharing, and the private-play carve-out (§1.8).** Sharing is providing content "to the public by any means", and "public" excludes "private, non-commercial play among friends, family, or gaming groups in a personal setting (in-person or online)". This one sentence is what makes the app possible for Daggerheart: the DM entering SRD-derived or homebrew Daggerheart content into a private, login-protected tool for their own table is not Sharing, so no Permitted Format is needed. The carve-out is what SPEC-012's open sign-up would break: a tool other groups can sign up to is no longer "a gaming group in a personal setting".

**Prohibited Content (§1.5)** — never licensed, in any format: DRP's trademarks and logos; art, illustrations, maps, plots, storylines and published titles; **"the exact text of manuals, guides, handbooks, Campaign Frames, and rulebooks"**; and all DRP Published Content. **Campaign Frames (§1.9.3)** may only be Shared as actual play; they "may not be … adapted into new written works or derivative works without separate written permission".

**The campaign frame inside SRD 2.0 — unresolved, and moot for the app.** SRD 2.0 carries one campaign frame, _The Witherwild_, and its first page says the document "including the Witherwild Campaign Frame" is Public Game Content. The licence points the other way. §1.6 names SRD 2.0 as Public Game Content but "specifically excludes all Prohibited Content"; §1.5(c) makes the exact text of Campaign Frames Prohibited Content; and §1.9.3 bars adapting Campaign Frames into new works without written permission. The SRD's wording may be the "expressly addressed elsewhere" that §1.5's opening allows, or the licence's exclusion may win — the texts do not settle it. Read conservatively: treat that frame like any other, usable only as actual play. It changes nothing here, because §7 rule 1 already keeps every publisher setting out of the shared sections, a licensed one included. If publication of anything frame-derived is ever wanted, ask DRP rather than rely on either reading. (Checked 2026-09-11 against the SRD 2.0 PDF and the DPCGL 2.0 text.)

**Name Marks (§2.5).** "Daggerheart" may not be used in the title of a work or a chapter, nor on a front cover, and in marketing or descriptive text it must be accompanied by "Compatible" — "Daggerheart™ Compatible". The example DRP gives: "An original campaign frame using the Daggerheart™ system" is fine; "Daggerheart: Shadows of the North" is not.

**Attribution (§4).** Non-commercial Sharing (§4.1) needs: a copyright notice, a statement that DRP created the Public Game Content used, a link to it, a statement that it is licensed under the DPCGL with a link, and **a statement of whether and how you modified it** — the reason SPEC-018 gives every Daggerheart record an `origin` of `homebrew` or `srdReference`. Commercial Sharing (§4.2) adds the Darrington Press Community Content logo on the front cover, the line _"Darrington Press™ and the Darrington Press authorized work logo are trademarks of Critical Role, LLC and used with permission."_ on the title page, and, on cards and adversaries, _"Daggerheart™ Compatible. Terms at Daggerheart.com"_.

**Release of claims (§5).** In exchange for the licence, the creator waives any infringement claim against DRP over content DRP may later publish that resembles theirs, short of identical copying. This is triggered by _exercising_ the Licensed Rights — i.e. by publishing — not by private use. It is the real price of publishing Daggerheart-compatible material and should be decided knowingly before the first export.

**Amendment (§11).** DRP may revise the licence at any time by posting it and announcing it; continued Sharing means acceptance (§11.2); work already distributed keeps the old terms, but any modified version falls under the new ones (§11.3). The text changed in May, June, July 2025 and August 2026. A private tool is insulated from this; a published supplement is not.

**Why structure in the public repo is defensible.** §1.7's definition of Adaptive Content is broad enough that a schema of Daggerheart fields could be read as "rearranged" Public Game Content. Two things hold the line. First, the DPCGL is a _grant_: it binds you only where you need it, and copyright does not protect game mechanics or single terms ("Hope", "Stress", "Evasion", "tier", "domain card"), so a table structure using them does not need the grant and is not Shared under it. Second, the moment protected expression enters the repo — a card's feature text, a class write-up, an adversary's stat block, a table from the SRD — the grant _is_ needed, and the repo is not a Permitted Format. That is exactly SPEC-018's line: structure yes, instances never, and the ten domains, the classes and the rest are data the DM enters. Keep it, and keep the SRD version the structure was restated from recorded in `docs/domain/daggerheart.md`, so a later SRD change can be re-checked against it.

**For the app.** Daggerheart works only because of the private-play carve-out and the structure/instance split. Three consequences: the audience stays closed (SPEC-012); the repo and the app's name never contain "Daggerheart" (the system label in the switch is descriptive reference; the risk is titles and covers); and any future publication goes to a Permitted Format — print/PDF, or a whitelisted VTT — with §4.1 attribution and the `origin` flag feeding the modification statement. There is no route by which the app itself becomes a public Daggerheart tool without DRP's written permission.

---

## 6. What the current repository already does — findings

Checked on 2026-09-11 against `120b426` — `main` plus SPEC-018's first draft, on the spec's branch.

1. **The seed ships Italian rulebook text.** [`app/seed/initial-data/spells.ts`](../../app/seed/initial-data/spells.ts) contains four spells (Aiuto, Bacche Benefiche, Caduta Morbida, Dardo Incantato — all SRD spells) and [`magicitems.ts`](../../app/seed/initial-data/magicitems.ts) four items (Anello di Rigenerazione, Bacchetta dei Segreti, Cintura della Forza dei Giganti, Difensiva — all SRD items) whose descriptions are the Italian _Player's Handbook_ / _Dungeon Master's Guide_ translation, not the CC-licensed Italian SRD. `importLibrary.ts` already documents that the DM's real library is "the Italian rulebook text — copyrightable prose that CLAUDE.md is explicit about never committing", and keeps it gitignored; the seed slipped past the same rule because it is small. It is the one place the public repo currently holds protected text. Two clean fixes: replace the descriptions with the wording from the official [Italian SRD](https://www.dndbeyond.com/srd) and add the CC-BY attribution statement (§3) to the repo; or replace them with invented placeholder prose, which needs no notice at all. The second is simpler and matches the custom-only rule. The deities and NPCs in the seed are the DM's own and need nothing.
2. **The repository has no `LICENSE` file.** Not a licence violation — an unlicensed public repository is simply "all rights reserved" — but once any third-party notice is added (CC-BY attribution, or an ORC Notice at export), it needs a home. A `LICENSE` for the code plus a `NOTICE.md` (or `LICENSES/`) for third-party game content is the usual shape.
3. **Names are clean.** The app is "Campaign Settings" and the repository is `nextjs-campaign-settings`; neither carries a publisher trademark. `README.md` describes it as "a D&D 5e homebrew campaign setting" tool — descriptive reference, acceptable, but as the app becomes multi-system the description should say "for D&D 5e, Pathfinder Second Edition and Daggerheart™ Compatible content", or simply "for several tabletop rule sets".
4. **SPEC-018's licence reading holds.** Every point in its §5 matched the current DPCGL text. One correction of detail: the PDF is titled "DPCGL 2.0" with "Last Updated 8/05/2026" and was published on the licence page on 2026-08-26; the SRD 2.0 is dated 2026-08-25. Record both dates.
5. **SPEC-012 is now a licence boundary, not only a security one.** Open sign-up would move the app from "private play" to "Sharing" for Daggerheart, and from "private" to "fan content / RPG product" for Pathfinder. Whatever SPEC-012 decides about internet exposure, the _audience_ must stay the DM's own groups: invited accounts, no self-service registration.
6. **Deities and religion need one content rule.** The shared religion section is licence-free as long as the pantheon is the DM's. Paizo's deities are Reserved Material under ORC and Wizards' setting deities are outside the SRD; the SRD 5.2.1 deliberately dropped even Tiamat and Orcus. The rule "the world is the DM's own" should be written down as a constraint on shared sections, not assumed.

---

## 7. Rules to carry into the specs

These restate the analysis as constraints a slice spec can cite.

1. **Shared sections hold only the DM's own world.** No publisher setting content (Golarion, Forgotten Realms, a Daggerheart Campaign Frame) in geography, religion, characters or factions — in the repo _or_ in the private database if publication is ever intended.
2. **Rules structure in the repo; rules instances never.** Field shapes, ranges, enumerations of mechanics are fine. No SRD spell, card, class, creature, item or table in seed, fixture or test data, for any of the three systems. This is already SPEC-018's acceptance criterion; this document extends it to 5e and PF2 for consistency, although their licences would allow it.
3. **Rulebook text — including official translations — is private-database content only.** The Italian _Player's Handbook_ wording is not the Italian SRD wording; only the latter is CC-licensed.
4. **Publisher names are labels, never titles.** "D&D 5e", "Pathfinder 2e", "Daggerheart" may name a system in the UI. The app's name, the repository's name and any published product's title carry none of them; descriptive text says "5E compatible", "Pathfinder Second Edition" (full name, per the Compatibility License) and "Daggerheart™ Compatible".
5. **The audience stays closed.** Invited accounts only. Public registration is a licence change, not a feature.
6. **Publication is per system, in that system's format, with that system's notice** — CC-BY attribution statement for 5e; ORC Notice with share-alike for PF2 (or the Compatibility License for the logo); DPCGL §4.1/§4.2 attribution, a Permitted Format, and the §5 release of claims for Daggerheart. The export spec, when written, takes the system from the campaign and picks the notice accordingly; the `origin` flag on Daggerheart records is what feeds the modification statement.
7. **Re-read the DPCGL before every Daggerheart publication.** It is amendable at will and has changed four times since May 2025; CC-BY and ORC are irrevocable and do not need this.

---

## 8. Sources

- Wizards of the Coast — [System Reference Document page](https://www.dndbeyond.com/srd) (SRD 5.1, SRD 5.2.1, localized versions incl. [Italian SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/IT_SRD_CC_v5.2.1.pdf)); [SRD 5.2.1 PDF, legal information](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf); [Creator FAQ](https://www.dndbeyond.com/creator-faq); [CC-BY-4.0 legal code](https://creativecommons.org/licenses/by/4.0/legalcode)
- Paizo — [Licenses overview](https://paizo.com/licenses); [ORC License](https://paizo.com/orclicense); [Fan Content Policy](https://paizo.com/licenses/fancontent); [Compatibility License](https://paizo.com/licenses/compatibility); [Community Use Policy](https://paizo.com/licenses/communityuse); [New and Revised Licenses, 2024-07-22](https://paizo.com/blog/new-and-revised-licenses); [Pathfinder Infinite and the ORC License, 2023-11-14](https://paizo.com/community/blog/v5748dyo6sig4)
- Darrington Press — [DPCGL page](https://darringtonpress.com/license/); [DPCGL 2.0 PDF (2026-08-26)](https://darringtonpress.com/wp-content/uploads/2026/08/DPCGL_2.0_AUG_26_2026.pdf); [Daggerheart SRD](https://www.daggerheart.com/srd/); [previous text, 2025-07-30](https://darringtonpress.com/wp-content/uploads/2025/07/DPCGL-July-30th-2025.pdf)
- [Golarion Insider — Pathfinder 2e wiki in Italian](https://pf2.altervista.org/wiki/Pagina_principale)
