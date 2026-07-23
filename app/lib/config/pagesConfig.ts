import PageType from "@/app/lib/definitions/types/PageType";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";

import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import PngMetaField from "@/app/lib/definitions/enums/png/PngMetaField";
import PatronoMetaField from "@/app/lib/definitions/enums/deities/PatronoMetaField";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";

/**
 * Which fields make up each page, in order.
 *
 * These are **keys into `pageMetaFields`**, not `PageMeta` values: a key is
 * what every other layer needs (it is also the payload key and the DB column),
 * and `MetaConfigKey` is the union of the real keys, so a wrong one is a
 * compile error.
 *
 * That matters here more than most places. This file previously held values and
 * reached them by camelCase property access — `pageMetaFields.tempoDiLancio`,
 * where the key is `tempodilancio` — so nine entries were `undefined` at
 * runtime and nothing said a word. The enum members below carry the lowercase
 * values while reading as the camelCase names, which is exactly the mismatch
 * that made the old form so easy to get wrong.
 *
 * `id`, `nome` and `descrizione` are declared directly in `pageMetaFields`
 * rather than in a domain meta, so they are plain string keys. `allineamento`,
 * `dominioAllineamento` and `luogo` are declared in `pngMeta` and shared with
 * deities, which is why the deity list reaches for `PngMetaField`.
 */
const pagesConfig: Record<PageType, MetaConfigKey[]> = {
  [PageType.Spell]: [
    "id",
    "nome",
    "descrizione",
    SpellMetaField.livello,
    SpellMetaField.circolo,
    SpellMetaField.classi,
    SpellMetaField.sottoClassi,
    SpellMetaField.tempoDiLancio,
    SpellMetaField.gittata,
    SpellMetaField.componenti,
    SpellMetaField.durata,
    SpellMetaField.tiroSalvezza,
    SpellMetaField.rituale,
    SpellMetaField.intensificato,
    SpellMetaField.concentrazione,
  ],
  [PageType.MagicItem]: [
    "id",
    "descrizione",
    "nome",
    MagicItemMetaField.rarita,
    MagicItemMetaField.tipo,
    MagicItemMetaField.sintonia,
  ],
  [PageType.Png]: [
    "id",
    "descrizione",
    "nome",
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
  [PageType.Deity]: [
    "id",
    "nome",
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
    PngMetaField.allineamento,
    PngMetaField.dominioAllineamento,
    PatronoMetaField.residenza,
    PngMetaField.luogo,
    PatronoMetaField.significato,
  ],
};

export default pagesConfig;
