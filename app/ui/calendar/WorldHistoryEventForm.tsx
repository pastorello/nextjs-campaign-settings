"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import createWorldHistoryEvent from "@/app/lib/data/calendar/createWorldHistoryEvent";
import updateWorldHistoryEvent from "@/app/lib/data/calendar/updateWorldHistoryEvent";
import calendarEventMeta from "@/app/lib/config/calendarEvent/calendarEventMeta";
import worldHistoryLinkMeta from "@/app/lib/config/calendarEvent/worldHistoryLinkMeta";
import CalendarEventMetaField from "@/app/lib/definitions/enums/calendar/CalendarEventMetaField";
import WorldHistoryLinkField from "@/app/lib/definitions/enums/calendar/WorldHistoryLinkField";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import WorldDateValue from "@/app/lib/definitions/interfaces/calendar/WorldDateValue";
import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
import WorldHistoryEventInput from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEventInput";
import MetaValue from "@/app/lib/definitions/types/MetaValue";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import resolveFieldErrors from "@/app/lib/utils/i18n/resolveFieldErrors";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import TextareaInput from "@/app/ui/forms/inputs/TextareaInput";
import CheckboxInput from "@/app/ui/forms/inputs/CheckboxInput";
import Select from "@/app/ui/forms/inputs/Select";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import WorldDateInput from "./WorldDateInput";

/** The options each link multiselect offers, read by the page. */
export interface WorldHistoryLinkOptions {
  zones: ResolvedOption<number>[];
  npcs: ResolvedOption<number>[];
  deities: ResolvedOption<number>[];
  factions: ResolvedOption<number>[];
}

interface WorldHistoryEventFormProps {
  systems: readonly DateSystem[];
  /** The system the date inputs open in — the one the page shows. */
  displaySystemId: number;
  linkOptions: WorldHistoryLinkOptions;
  /** The event being edited; absent to create one. */
  event?: WorldHistoryEvent | undefined;
  onCancel: () => void;
  onSaved: () => void;
}

const formMeta = { ...calendarEventMeta, ...worldHistoryLinkMeta };

const toIds = (value: MetaValue): number[] =>
  Array.isArray(value) ? value.map(Number) : [];

/**
 * Adds or edits a world history event (SPEC-014 §5.4, T5): title,
 * description, a start and an optional end — each a `WorldDateInput` —
 * "repeats every year", and the places, NPCs, deities and factions it
 * links. The fields' labels and validators are `calendarEventMeta` /
 * `worldHistoryLinkMeta`'s; the layout is this form's (ADR-0011).
 *
 * The end is behind a checkbox rather than an empty date input: the input
 * reports `null` both for "left blank" and "not a real date yet", so an
 * empty end could not be told apart from a mistyped one.
 */
export default function WorldHistoryEventForm({
  systems,
  displaySystemId,
  linkOptions,
  event,
  onCancel,
  onSaved,
}: WorldHistoryEventFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const isEditMode = event !== undefined;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [start, setStart] = useState<WorldDateValue>({
    universalDay: event?.startDay ?? null,
    hour: event?.startHour ?? null,
  });
  const [hasEnd, setHasEnd] = useState(
    event !== undefined && event.endDay !== null
  );
  const [end, setEnd] = useState<WorldDateValue>({
    universalDay: event?.endDay ?? event?.startDay ?? null,
    hour: event?.endHour ?? null,
  });
  const [repeatsYearly, setRepeatsYearly] = useState(
    event?.repeatsYearly ?? false
  );
  const [zoneIds, setZoneIds] = useState(ids(event?.zones));
  const [npcIds, setNpcIds] = useState(ids(event?.npcs));
  const [deityIds, setDeityIds] = useState(ids(event?.deities));
  const [factionIds, setFactionIds] = useState(ids(event?.factions));
  const { errors, isSaving, submit } = useMutationSubmit();

  const fieldErrors = resolveFieldErrors(errors, t);
  const dateError = (day: string, hour: string) => {
    const messages = [
      ...(fieldErrors[day] ?? []),
      ...(fieldErrors[hour] ?? []),
    ];
    return messages.length === 0 ? undefined : messages.join(", ");
  };

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const payload: WorldHistoryEventInput = {
      title,
      description: description.trim() === "" ? null : description,
      startDay: start.universalDay,
      startHour: start.hour,
      endDay: hasEnd ? end.universalDay : null,
      endHour: hasEnd ? end.hour : null,
      repeatsYearly,
      zoneIds,
      npcIds,
      deityIds,
      factionIds,
    };

    const saved = await submit(() =>
      isEditMode
        ? updateWorldHistoryEvent(event.id, payload)
        : createWorldHistoryEvent(payload)
    );
    if (!saved) return;

    router.refresh();
    onSaved();
  }

  const label = (key: keyof typeof formMeta) => t(formMeta[key].labelKey);

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <BespokeFormErrorSummary errors={errors} meta={formMeta} />
      <TextInput
        label={label(CalendarEventMetaField.title)}
        value={title}
        onChange={(value) => setTitle(String(value))}
      />
      <TextareaInput
        label={label(CalendarEventMetaField.description)}
        value={description}
        onChange={(value) => setDescription(String(value))}
        tall={calendarEventMeta.description.tall}
      />
      <WorldDateInput
        legend={label(CalendarEventMetaField.startDay)}
        systems={systems}
        value={start}
        onChange={setStart}
        initialSystemId={displaySystemId}
        error={dateError("startDay", "startHour")}
      />
      <CheckboxInput
        label={t("calendar.event.form.hasEnd")}
        value={hasEnd}
        onChange={(value) => setHasEnd(value === true)}
      />
      {hasEnd && (
        <WorldDateInput
          legend={label(CalendarEventMetaField.endDay)}
          systems={systems}
          value={end}
          onChange={setEnd}
          initialSystemId={displaySystemId}
          error={dateError("endDay", "endHour")}
        />
      )}
      <CheckboxInput
        label={label(CalendarEventMetaField.repeatsYearly)}
        value={repeatsYearly}
        onChange={(value) => setRepeatsYearly(value === true)}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label={label(WorldHistoryLinkField.zoneIds)}
          value={zoneIds}
          options={linkOptions.zones}
          multiple
          onChange={(value) => setZoneIds(toIds(value))}
        />
        <Select
          label={label(WorldHistoryLinkField.npcIds)}
          value={npcIds}
          options={linkOptions.npcs}
          multiple
          onChange={(value) => setNpcIds(toIds(value))}
        />
        <Select
          label={label(WorldHistoryLinkField.deityIds)}
          value={deityIds}
          options={linkOptions.deities}
          multiple
          onChange={(value) => setDeityIds(toIds(value))}
        />
        <Select
          label={label(WorldHistoryLinkField.factionIds)}
          value={factionIds}
          options={linkOptions.factions}
          multiple
          onChange={(value) => setFactionIds(toIds(value))}
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

function ids(rows: readonly { id: number }[] | undefined): number[] {
  return rows?.map(({ id }) => id) ?? [];
}
