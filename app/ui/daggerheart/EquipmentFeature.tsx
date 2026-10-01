import renderRichText from "@/app/lib/utils/data/renderRichText";

/**
 * A piece of equipment's one feature (SPEC-029 §6), at the foot of its
 * card; nothing when it has none.
 */
export default function EquipmentFeature({
  name,
  text,
}: {
  name: string | null;
  text: string | null;
}) {
  if (!name || !text) return null;
  return (
    <section className="border-t border-gray-200 pt-2">
      <p className="font-semibold">{name}</p>
      <div>{renderRichText(text)}</div>
    </section>
  );
}
