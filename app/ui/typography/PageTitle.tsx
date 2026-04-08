import { lusitana } from "@/app/ui/fonts";
import clsx from "clsx";

const PageTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={clsx("flex w-full items-center justify-between", className)}
    >
      <h1 className={`${lusitana.className} text-2xl`}>{children}</h1>
    </div>
  );
};

export default PageTitle;
