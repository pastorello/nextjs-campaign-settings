import MagicItemMetaField from "../definitions/enums/magicitem/MagicItemMetaField";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import PatronoMetaField from "../definitions/enums/deities/PatronoMetaField";
import PngMetaField from "../definitions/enums/png/PngMetaField";
import PageType from "../definitions/types/PageType";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";

/**
 * The fields each domain's form holds state for (TD-09).
 *
 * **Why this is not `pagesConfig`.** That lists every field an entity *has*,
 * and drives validation. This lists the fields a form *edits*, which is a
 * smaller set — and the difference is not always deliberate. `pagesConfig`
 * declares `tiroSalvezza` and `concentrazione` for spells; no form control and
 * no hook state has ever existed for either, so neither can be set from the UI
 * at all despite having a column, metadata and a validator. Keeping the two
 * lists separate records that gap instead of silently closing it: adding those
 * fields to a form is a product decision, not a refactor.
 *
 * These lists reproduce exactly what the four page-manager hooks held before
 * they were collapsed. Any change to them is a behaviour change.
 */
const formFields: Record<PageType, MetaConfigKey[]> = {
  [PageType.Spell]: [
    SpellMetaField.nome,
    SpellMetaField.descrizione,
    SpellMetaField.livello,
    SpellMetaField.circolo,
    SpellMetaField.classi,
    SpellMetaField.tempoDiLancio,
    SpellMetaField.gittata,
    SpellMetaField.componenti,
    SpellMetaField.durata,
    SpellMetaField.rituale,
    SpellMetaField.intensificato,
  ],

  [PageType.MagicItem]: [
    MagicItemMetaField.nome,
    MagicItemMetaField.descrizione,
    MagicItemMetaField.rarita,
    MagicItemMetaField.tipo,
    MagicItemMetaField.sintonia,
  ],

  [PageType.Png]: [
    PngMetaField.nome,
    PngMetaField.descrizione,
    PngMetaField.titolo,
    PngMetaField.allineamento,
    PngMetaField.dominioAllineamento,
    PngMetaField.mansione,
    PngMetaField.luogo,
    PngMetaField.fazione,
    PngMetaField.aspetto,
    PngMetaField.personalita,
    PngMetaField.motivazioni,
    PngMetaField.segreti,
  ],

  // No `descrizione`: deities carry `significato` instead, and the schema has
  // no descrizione column for them.
  [PageType.Deity]: [
    PatronoMetaField.nome,
    PatronoMetaField.titoloPatrono,
    PatronoMetaField.tipoPatrono,
    PatronoMetaField.gradoPatrono,
    PatronoMetaField.card,
    PatronoMetaField.astri,
    PatronoMetaField.elemento,
    PatronoMetaField.classe,
    PatronoMetaField.festivita,
    PatronoMetaField.colore,
    PatronoMetaField.tradizione,
    PatronoMetaField.allineamento,
    PatronoMetaField.dominioAllineamento,
    PatronoMetaField.residenza,
    PatronoMetaField.luogo,
    PatronoMetaField.significato,
  ],
};

export default formFields;
