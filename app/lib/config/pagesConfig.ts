import PageType from "@/app/lib/definitions/types/PageType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";

import pageMetaFields from "@/app/lib/config/pageMetaFields";

const pagesConfig: Record<PageType, PageMeta[]> = {
  [PageType.Spell]: [
    pageMetaFields.id,
    pageMetaFields.descrizione,
    pageMetaFields.livello,
    pageMetaFields.circolo,
    pageMetaFields.classi,
    pageMetaFields.sottoClassi,
    pageMetaFields.tempoDiLancio,
    pageMetaFields.gittata,
    pageMetaFields.componenti,
    pageMetaFields.durata,
    pageMetaFields.tiroSalvezza,
    pageMetaFields.rituale,
    pageMetaFields.intensificato,
    pageMetaFields.concentrazione,
  ],
  [PageType.MagicItem]: [
    pageMetaFields.id,
    pageMetaFields.descrizione,
    pageMetaFields.nome,
    pageMetaFields.rarita,
    pageMetaFields.tipo,
    pageMetaFields.sintonia,
  ],
  [PageType.Png]: [
    pageMetaFields.id,
    pageMetaFields.descrizione,
    pageMetaFields.nome,
    pageMetaFields.titolo,
    pageMetaFields.allineamento,
    pageMetaFields.dominioAllineamento,
    pageMetaFields.mansione,
    pageMetaFields.luogo,
    pageMetaFields.fazione,
    pageMetaFields.aspetto,
    pageMetaFields.personalita,
    pageMetaFields.motivazioni,
    pageMetaFields.segreti,
  ],
  [PageType.Deity]: [
    pageMetaFields.id,
    pageMetaFields.nome,
    pageMetaFields.titoloPatrono,
    pageMetaFields.tipoPatrono,
    pageMetaFields.gradoPatrono,
    pageMetaFields.card,
    pageMetaFields.astri,
    pageMetaFields.elemento,
    pageMetaFields.classe,
    pageMetaFields.festivita,
    pageMetaFields.colore,
    pageMetaFields.tradizione,
    pageMetaFields.allineamento,
    pageMetaFields.dominioAllineamento,
    pageMetaFields.residenza,
    pageMetaFields.luogo,
    pageMetaFields.significato,
  ],
};

export default pagesConfig;
