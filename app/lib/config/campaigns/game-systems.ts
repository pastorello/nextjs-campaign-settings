import GameSystem, { GAME_SYSTEMS } from "@/app/lib/definitions/GameSystem";

interface GameSystemObject {
  value: GameSystem;
  labelKey: string;
}

/**
 * The options for `campaign.system` (SPEC-018 T3), one per `GAME_SYSTEMS`
 * value, so a system that joins the vocabulary is offered without touching
 * this file. The label is the system's display name under `gameSystems.*`.
 */
const gameSystems: GameSystemObject[] = GAME_SYSTEMS.map((system) => ({
  value: system,
  labelKey: `gameSystems.${system}`,
}));

export default gameSystems;
