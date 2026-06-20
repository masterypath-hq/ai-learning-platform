import type { Metadata } from "next";
import { JourneyWizard } from "@/components/journey/JourneyWizard";

export const metadata: Metadata = { title: "New Journey" };

export default function NewJourneyPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Start a New Journey
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Answer a few questions and your AI tutor will build a custom curriculum for you.
        </p>
      </div>
      <JourneyWizard />
    </div>
  );
}
