import SelectOption, {
  ResolvedOption,
} from "../../definitions/types/SelectOption";

// A translator, as returned by both next-intl's `useTranslations` (client)
// and `await getTranslations` (server) — the shape this function is bridged
// across, per ADR-0007.
type Translator = (key: string) => string;

const resolveOptions = <TValue extends string | number>(
  options: SelectOption<TValue>[],
  t: Translator
): ResolvedOption<TValue>[] =>
  options.map(({ labelKey, shortLabelKey, value }) => ({
    label: t(labelKey),
    ...(shortLabelKey !== undefined && { shortLabel: t(shortLabelKey) }),
    value,
  }));

export default resolveOptions;
