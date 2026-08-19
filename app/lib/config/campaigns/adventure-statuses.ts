import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

interface AdventureStatusObject {
  type: AdventureStatus;
  value: AdventureStatus;
  labelKey: string;
}

const adventureStatuses: AdventureStatusObject[] = [
  {
    value: AdventureStatus.Planned,
    labelKey: "adventure.statuses.planned",
    type: AdventureStatus.Planned,
  },
  {
    value: AdventureStatus.Active,
    labelKey: "adventure.statuses.active",
    type: AdventureStatus.Active,
  },
  {
    value: AdventureStatus.Completed,
    labelKey: "adventure.statuses.completed",
    type: AdventureStatus.Completed,
  },
];

export default adventureStatuses;
