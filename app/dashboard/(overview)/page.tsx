import CardWrapper from "@/app/ui/dashboard/cards";
import { lusitana } from "@/app/ui/fonts";
import { Suspense } from "react";
import { CardsSkeleton } from "@/app/ui/skeletons";

// The cards below are live record counts. Without this the page has no dynamic
// input — no searchParams, no cookies — so Next prerenders it at build time and
// the counts freeze at whatever the database held when the build ran. Adding a
// spell would never change the number. It also means the build needs a reachable
// database, which is why CI's build job could not pass.
//
// Every sibling page under /dashboard is dynamic already, but only by accident:
// they read searchParams. This one has to say so.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main data-testid="dashboard-page">
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
    </main>
  );
}
