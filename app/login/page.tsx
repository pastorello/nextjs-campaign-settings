import LoginForm from "@/app/ui/login-form";
import { Suspense } from "react";
import { Metadata } from "next";
import CampaignSettingsLogo from "../ui/icons/CampaignSettingsLogo";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-100 flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-blue-500 p-3 md:h-36">
          <CampaignSettingsLogo size="lg" />
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
