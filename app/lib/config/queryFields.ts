import MagicItemMetaField from "../definitions/enums/magicitem/MagicItemMetaField";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import PageType from "../definitions/types/PageType";
import PatronoMetaField from "../definitions/enums/deities/PatronoMetaField";
import PngMetaField from "../definitions/enums/png/PngMetaField";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";

/**
 * The fields a domain can be filtered by, declared once (TD-12).
 *
 * **Why once matters.** `fetchFilteredX` and `getXCount` each used to carry
 * their own copy of this list, and they had drifted: the spell count was
 * missing `nome`, and the NPC count listed four of the twelve fields the NPC
 * fetch used. Since both build a `where` from the same search params, that
 * meant the header could describe a different result set than the table below
 * it — and it did, reproducibly:
 *
 *     /dashboard/admin/png?titolo=Arcivescovo
 *       header: "119 di 119 PNG trovati"
 *       table:  0 rows
 *
 * The rows were filtered, the count was not, and the pagination control offered
 * four pages of nothing. Reachable by editing the URL today; reachable by
 * clicking as soon as a filter control is added for one of the missing fields.
 *
 * Both functions read this list now, so the two queries cannot disagree.
 */
const queryFields: Record<PageType, MetaConfigKey[]> = {
  [PageType.Spell]: [
    SpellMetaField.nome,
    SpellMetaField.livello,
    SpellMetaField.circolo,
    SpellMetaField.classi,
    SpellMetaField.tempoDiLancio,
    SpellMetaField.gittata,
    SpellMetaField.componenti,
    SpellMetaField.durata,
    SpellMetaField.tiroSalvezza,
    SpellMetaField.rituale,
    SpellMetaField.concentrazione,
    SpellMetaField.descrizione,
    SpellMetaField.intensificato,
  ],

  [PageType.Png]: [
    PngMetaField.nome,
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
    PngMetaField.descrizione,
  ],

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

  // No `nome` or `descrizione` here, unlike the other three. That is how both
  // magic item queries already were — they agreed with each other, so this
  // preserves their behaviour rather than quietly widening it.
  [PageType.MagicItem]: [
    MagicItemMetaField.rarita,
    MagicItemMetaField.tipo,
    MagicItemMetaField.sintonia,
  ],
};

export default queryFields;
