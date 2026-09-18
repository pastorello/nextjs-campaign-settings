"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import createCampaignEvent from "@/app/lib/data/calendar/createCampaignEvent";
import updateCampaignEvent from "@/app/lib/data/calendar/updateCampaignEvent";
import calendarEventMeta from "@/app/lib/config/calendarEvent/calendarEventMeta";
import campaignEventOwnerMeta from "@/app/lib/config/calendarEvent/campaignEventOwnerMeta";
import CampaignEventOwnerField from "@/app/lib/definitions/enums/calendar/CampaignEventOwnerField";
import CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import CampaignEventInput from "@/app/lib/definitions/interfaces/calendar/CampaignEventInput";
import CampaignSceneOption from "@/app/lib/definitions/interfaces/calendar/CampaignSceneOption";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import LinkedRow from "@/app/lib/definitions/interfaces/calendar/LinkedRow";
import resolveFieldErrors from "@/app/lib/utils/i18n/resolveFieldErrors";
import Select from "@/app/ui/forms/inputs/Select";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import { draftFromEvent, draftToInput } from "./calendarEventDraft";
import CalendarEventFields from "./CalendarEventFields";

/** The adventures and scenes an event may name — the campaign's own. */
export interface CampaignEventOwnerOptions {
  adventures: LinkedRow[];
  scenes: CampaignSceneOption[];
}

interface CampaignEventFormProps {
  campaignId: number;
  systems: readonly DateSystem[];
  /** The system the date inputs open in — the one the page shows. */
  displaySystemId: number;
  ownerOptions: CampaignEventOwnerOptions;
  /** The event being edited; absent to create one. */
  event?: CampaignEvent | undefined;
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * "None": never a row id, which is always positive, and the value
 * `sortSelectOptions` keeps at the top of the list.
 */
const NONE = -1;

const formMeta = { ...calendarEventMeta, ...campaignEventOwnerMeta };

/**
 * Adds or edits a campaign event (SPEC-014 §5.4, T6): the fields every
 * event has (`CalendarEventFields`), then the adventure and the scene it
 * names. The scene select offers the chosen adventure's scenes, or every
 * scene of the campaign with no adventure chosen — labelled with their
 * adventure — since the action then sets the adventure from the scene.
 * Choosing another adventure drops a scene that is not in it.
 *
 * Labels and validators are `calendarEventMeta` / `campaignEventOwnerMeta`'s;
 * the layout is this form's (ADR-0011).
 */
export default function CampaignEventForm({
  campaignId,
  systems,
  displaySystemId,
  ownerOptions,
  event,
  onCancel,
  onSaved,
}: CampaignEventFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const isEditMode = event !== undefined;

  const [draft, setDraft] = useState(() => draftFromEvent(event));
  const [adventureId, setAdventureId] = useState(event?.adventure?.id ?? NONE);
  const [sceneId, setSceneId] = useState(event?.scene?.id ?? NONE);
  const { errors, isSaving, submit } = useMutationSubmit();

  const fieldErrors = resolveFieldErrors(errors, t);
  const adventureTitle = new Map(
    ownerOptions.adventures.map(({ id, name }) => [id, name])
  );
  const scenes = ownerOptions.scenes.filter(
    (scene) => adventureId === NONE || scene.adventureId === adventureId
  );

  function chooseAdventure(id: number) {
    setAdventureId(id);
    const scene = ownerOptions.scenes.find(({ id: s }) => s === sceneId);
    if (id !== NONE && scene?.adventureId !== id) setSceneId(NONE);
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const payload: CampaignEventInput = {
      ...draftToInput(draft),
      adventureId: adventureId === NONE ? null : adventureId,
      sceneId: sceneId === NONE ? null : sceneId,
    };

    const saved = await submit(() =>
      isEditMode
        ? updateCampaignEvent(event.id, payload)
        : createCampaignEvent(campaignId, payload)
    );
    if (!saved) return;

    router.refresh();
    onSaved();
  }

  const label = (field: CampaignEventOwnerField) =>
    t(campaignEventOwnerMeta[field].labelKey);

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <BespokeFormErrorSummary errors={errors} meta={formMeta} />
      <CalendarEventFields
        draft={draft}
        onChange={(changes) =>
          setDraft((current) => ({ ...current, ...changes }))
        }
        systems={systems}
        displaySystemId={displaySystemId}
        fieldErrors={fieldErrors}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label={label(CampaignEventOwnerField.adventureId)}
          value={adventureId}
          options={[
            { value: NONE, label: t("calendar.event.form.noAdventure") },
            ...ownerOptions.adventures.map(({ id, name }) => ({
              value: id,
              label: name,
            })),
          ]}
          onChange={(value) => chooseAdventure(Number(value))}
        />
        <Select
          label={label(CampaignEventOwnerField.sceneId)}
          value={sceneId}
          options={[
            { value: NONE, label: t("calendar.event.form.noScene") },
            ...scenes.map((scene) => ({
              value: scene.id,
              label:
                adventureId === NONE
                  ? `${adventureTitle.get(scene.adventureId) ?? ""} · ${scene.title}`
                  : scene.title,
            })),
          ]}
          onChange={(value) => setSceneId(Number(value))}
        />
      </div>
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {isEditMode
            ? t("calendar.event.form.editButton")
            : t("calendar.event.form.createButton")}
        </BaseButton>
        <BaseButton
          onClick={onCancel}
          variant={ButtonVariant.secondary}
          buttonState={isSaving ? ButtonState.Disabled : ButtonState.Default}
        >
          {t("common.form.cancel")}
        </BaseButton>
      </div>
    </form>
  );
}
