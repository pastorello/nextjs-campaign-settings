import clsx from "clsx";

/**
 * The shared style for an in-page `h2` (TD-116) — `AdventureLadder`,
 * `SceneList` and `BudgetPanel` each had their own `<h2>` (two at `text-xl
 * font-bold`, one at `text-lg font-bold` with its own margin), a third,
 * unshared heading style alongside `PageTitle`'s Lusitana and the admin
 * form's now-removed bold-Inter `<h1>`. One declaration here instead.
 */
const SectionTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <h2 className={clsx("text-lg font-bold", className)}>{children}</h2>;
};

export default SectionTitle;
