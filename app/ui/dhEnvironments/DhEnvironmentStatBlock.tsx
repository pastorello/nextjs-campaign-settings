import { useTranslations } from "next-intl";

import dhEnvironmentTypes from "@/app/lib/config/daggerheart/dhEnvironmentTypes";
import DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link } from "@/i18n/navigation";
import optionLabel from "@/app/ui/daggerheart/optionLabel";
import StatBlockView, {
  StatBlockNumber,
} from "@/app/ui/daggerheart/StatBlockView";
import StatBlockFeatureLine from "@/app/ui/daggerheart/StatBlockFeatureLine";

/**
 * An environment's stat block (SPEC-028 §5.3): tier and type on the band,
 * the description and impulses, the Difficulty, the potential adversaries
 * — each linking to its own block — and the free-text rest, the places it
 * describes (each opening its map), then the features with their
 * questions.
 */
export default function DhEnvironmentStatBlock({
  environment,
  headingLevel,
}: {
  environment: DhEnvironment;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const t = useTranslations();
  const system = useGameSystem();
  const type = optionLabel(dhEnvironmentTypes, environment.environmentType, t);
  const adversaries = environment.adversaries ?? [];
  const places = environment.places ?? [];
  const features = environment.features ?? [];

  return (
    <StatBlockView
      name={environment.name}
      headerLine={t("dhEnvironments.statBlock.header", {
        tier: environment.tier,
        type,
      })}
      image={environment.image}
      imageAlt={t("dhEnvironments.statBlock.imageAlt", {
        name: environment.name,
      })}
      testId="dh-environment-stat-block"
      {...(headingLevel && { headingLevel })}
    >
      {environment.description && (
        <div className="italic">{renderRichText(environment.description)}</div>
      )}
      {environment.impulses && (
        <p>
          <span className="font-semibold">
            {t("dhEnvironments.statBlock.impulses")}:
          </span>{" "}
          {environment.impulses}
        </p>
      )}
      <dl className="flex flex-wrap gap-x-6 gap-y-2 border-y border-gray-200 py-2">
        <StatBlockNumber
          label={t("daggerheart.fields.difficulty.label")}
          value={environment.difficulty}
        />
      </dl>
      {(adversaries.length > 0 || environment.otherAdversaries) && (
        <p>
          <span className="font-semibold">
            {t("dhEnvironments.statBlock.adversaries")}:
          </span>{" "}
          {adversaries.map((adversary, index) => (
            <span key={adversary.id}>
              {index > 0 && ", "}
              <Link
                href={dashboardPath(
                  system,
                  `/adversaries?query=${encodeURIComponent(adversary.name)}&view=cards`
                )}
                className="underline"
              >
                {adversary.name}
              </Link>
            </span>
          ))}
          {adversaries.length > 0 && environment.otherAdversaries && ", "}
          {environment.otherAdversaries}
        </p>
      )}
      {places.length > 0 && (
        <p>
          <span className="font-semibold">
            {t("dhEnvironments.statBlock.places")}:
          </span>{" "}
          {places.map((place, index) => (
            <span key={place.id}>
              {index > 0 && ", "}
              <Link
                href={dashboardPath(system, `/geography?place=${place.id}`)}
                className="underline"
              >
                {place.name}
              </Link>
            </span>
          ))}
        </p>
      )}
      {features.length > 0 && (
        <section className="border-t border-gray-200 pt-2">
          <p className="mb-1 font-semibold uppercase">
            {t("dhEnvironments.statBlock.features")}
          </p>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature.id}>
                <StatBlockFeatureLine feature={feature} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </StatBlockView>
  );
}
