import ListColumn from "../definitions/interfaces/lists/ListColumn";
import MagicItemMetaField from "../definitions/enums/magicitem/MagicItemMetaField";
import DeityMetaField from "../definitions/enums/deities/DeityMetaField";
import NpcMetaField from "../definitions/enums/npc/NpcMetaField";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";
import PageType from "../definitions/types/PageType";

/**
 * What each domain's admin list shows, declared once (TD-09).
 *
 * These four lists used to be four components of ~110 lines each, identical
 * apart from the rows below. They diverged exactly as you would expect: the
 * deities list was rendering `luogo` through `tipoPatrono`'s metadata under a
 * "Residenza" header, was missing its "Azioni" header entirely, and told the
 * user "Nessun PNG trovato" — three defects that no compiler or test could see,
 * because there was nothing to compare each file against. Fixed separately in
 * PR #30; this table is what stops them recurring.
 *
 * The order of `columns` is the order on screen. `nome` is always first and is
 * rendered specially by `EntityList`, so it is not listed here.
 */
interface ListConfig {
  /** Columns after `nome`, in display order. */
  columns: ListColumn[];

  /** Shown when a filter matches nothing. */
  emptyMessage: string;

  /** Title of the edit dialog opened from a row. */
  editModalTitle: string;

  /** Which form `ModalButton` renders — see its `modalContent` switch. */
  modalContent: string;

  /** Rendered under the name in the first cell. */
  subtitleField?: ListColumn["subtitleField"];
}

const listConfig: Record<PageType, ListConfig> = {
  [PageType.Spell]: {
    columns: [
      { fieldKey: SpellMetaField.level, label: "Livello" },
      { fieldKey: SpellMetaField.classes, label: "Classi" },
    ],
    emptyMessage: "Nessun Incantesimo trovato",
    editModalTitle: "Modifica Incantesimo",
    modalContent: "spellform",
  },

  [PageType.Npc]: {
    columns: [
      { fieldKey: NpcMetaField.alignment, label: "Allineamento" },
      { fieldKey: NpcMetaField.alignmentDomain, label: "Dominio" },
      { fieldKey: NpcMetaField.faction, label: "Fazione" },
      { fieldKey: NpcMetaField.location, label: "Luogo" },
    ],
    emptyMessage: "Nessun PNG trovato",
    editModalTitle: "Modifica PNG",
    modalContent: "npcform",
    subtitleField: NpcMetaField.title,
  },

  [PageType.Deity]: {
    columns: [
      { fieldKey: DeityMetaField.alignment, label: "Allineamento" },
      { fieldKey: DeityMetaField.alignmentDomain, label: "Dominio" },
      { fieldKey: DeityMetaField.deityRank, label: "Grado" },
      { fieldKey: DeityMetaField.deityType, label: "Tipo" },
      { fieldKey: DeityMetaField.residence, label: "Residenza" },
    ],
    emptyMessage: "Nessuna divinità trovata",
    editModalTitle: "Modifica Divinità",
    modalContent: "deityform",
  },

  [PageType.MagicItem]: {
    columns: [
      { fieldKey: MagicItemMetaField.rarity, label: "Rarità" },
      { fieldKey: MagicItemMetaField.type, label: "Tipo di oggetto" },
      // Two values, so ordering by it groups rather than sorts.
      {
        fieldKey: MagicItemMetaField.attuned,
        label: "Sintonia",
        sortable: false,
      },
    ],
    emptyMessage: "Nessun oggetto magico trovato",
    editModalTitle: "Modifica oggetto magico",
    modalContent: "magicitemform",
  },
};

export default listConfig;
export type { ListConfig };
