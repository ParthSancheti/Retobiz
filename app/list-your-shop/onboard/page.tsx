import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Onboarding" };

export default function Page() {
  return <OnboardingWizard />;
}
