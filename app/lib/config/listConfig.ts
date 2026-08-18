import ListColumn from "../definitions/interfaces/lists/ListColumn";
import MagicItemMetaField from "../definitions/enums/magicitem/MagicItemMetaField";
import TreasureMetaField from "../definitions/enums/treasure/TreasureMetaField";
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

  /** Shown when a filter matches nothing, as a message key. */
  emptyMessageKey: string;

  /** Title of the edit dialog opened from a row, as a message key. */
  editModalTitleKey: string;

  /** Which form `ModalButton` renders — see its `modalContent` switch. */
  modalContent: string;

  /** Rendered under the name in the first cell. */
  subtitleField?: ListColumn["subtitleField"];
}

const listConfig: Record<PageType, ListConfig> = {
  [PageType.Spell]: {
    columns: [
      { fieldKey: SpellMetaField.level, labelKey: "spells.fields.level.label" },
      {
        fieldKey: SpellMetaField.classes,
        labelKey: "spells.fields.classes.label",
      },
    ],
    emptyMessageKey: "spells.page.emptyMessage",
    editModalTitleKey: "spells.form.editTitle",
    modalContent: "spellform",
  },

  [PageType.Npc]: {
    columns: [
      {
        fieldKey: NpcMetaField.alignment,
        labelKey: "npc.fields.alignment.label",
      },
      {
        fieldKey: NpcMetaField.alignmentDomain,
        labelKey: "npc.fields.alignmentDomain.label",
      },
      {
        fieldKey: NpcMetaField.faction,
        labelKey: "npc.fields.faction.label",
        // Table-backed (SPEC-006 T7) — `SortableHeader`'s built-in filter
        // reads `PageMeta.options`, the same shape gap that made "location"
        // bespoke. A faction filter would need its own component the way
        // `LocationFilterControl` is one; nobody has asked for it yet.
        isFiltrable: false,
      },
      {
        fieldKey: "location",
        labelKey: "common.table.location",
        isFiltrable: false,
      },
    ],
    emptyMessageKey: "npc.page.emptyMessage",
    editModalTitleKey: "npc.form.editTitle",
    modalContent: "npcform",
    subtitleField: NpcMetaField.title,
  },

  [PageType.Deity]: {
    columns: [
      {
        fieldKey: DeityMetaField.alignment,
        labelKey: "npc.fields.alignment.label",
      },
      {
        fieldKey: DeityMetaField.alignmentDomain,
        labelKey: "npc.fields.alignmentDomain.label",
      },
      {
        fieldKey: DeityMetaField.deityRank,
        labelKey: "deities.fields.deityRank.label",
      },
      {
        fieldKey: DeityMetaField.deityType,
        labelKey: "deities.fields.deityType.label",
      },
      {
        fieldKey: "location",
        labelKey: "common.table.location",
        isFiltrable: false,
      },
    ],
    emptyMessageKey: "deities.page.emptyMessage",
    editModalTitleKey: "deities.form.editTitle",
    modalContent: "deityform",
  },

  [PageType.MagicItem]: {
    columns: [
      {
        fieldKey: MagicItemMetaField.rarity,
        labelKey: "magicItems.fields.rarity.label",
      },
      {
        fieldKey: MagicItemMetaField.type,
        labelKey: "magicItems.fields.type.label",
      },
      // Two values, so ordering by it groups rather than sorts.
      {
        fieldKey: MagicItemMetaField.attuned,
        labelKey: "magicItems.fields.attuned.shortLabel",
        sortable: false,
      },
    ],
    emptyMessageKey: "magicItems.page.emptyMessage",
    editModalTitleKey: "magicItems.form.editTitle",
    modalContent: "magicitemform",
  },

  [PageType.Faction]: {
    columns: [
      {
        fieldKey: "description",
        labelKey: "common.fields.description.label",
        // Free text, not a closed vocabulary — SortableHeader's built-in
        // filter select needs `PageMeta.options`, which this field has none
        // of.
        isFiltrable: false,
      },
    ],
    emptyMessageKey: "factions.page.emptyMessage",
    editModalTitleKey: "factions.form.editTitle",
    modalContent: "factionform",
  },

  [PageType.Treasure]: {
    columns: [
      {
        fieldKey: TreasureMetaField.category,
        labelKey: "treasure.fields.category.label",
      },
      {
        fieldKey: TreasureMetaField.value,
        labelKey: "treasure.fields.value.label",
        // Free-form silver amount, not a closed vocabulary — SortableHeader's
        // built-in filter select needs `PageMeta.options`, which this field
        // has none of (same reasoning as factions' `description` column).
        isFiltrable: false,
      },
    ],
    emptyMessageKey: "treasure.page.emptyMessage",
    editModalTitleKey: "treasure.form.editTitle",
    modalContent: "treasureform",
  },
};

export default listConfig;
export type { ListConfig };
