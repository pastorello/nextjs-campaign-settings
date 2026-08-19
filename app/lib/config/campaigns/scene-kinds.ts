import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";

interface SceneKindObject {
  type: SceneKind;
  value: SceneKind;
  labelKey: string;
}

const sceneKinds: SceneKindObject[] = [
  {
    value: SceneKind.Fight,
    labelKey: "scene.kinds.fight",
    type: SceneKind.Fight,
  },
  {
    value: SceneKind.Explore,
    labelKey: "scene.kinds.explore",
    type: SceneKind.Explore,
  },
  { value: SceneKind.Clue, labelKey: "scene.kinds.clue", type: SceneKind.Clue },
  { value: SceneKind.Goal, labelKey: "scene.kinds.goal", type: SceneKind.Goal },
  {
    value: SceneKind.Dungeon,
    labelKey: "scene.kinds.dungeon",
    type: SceneKind.Dungeon,
  },
  {
    value: SceneKind.Break,
    labelKey: "scene.kinds.break",
    type: SceneKind.Break,
  },
];

export default sceneKinds;
