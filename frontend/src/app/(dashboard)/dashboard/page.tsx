import type { Metadata } from "next";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { ActiveTrackBar } from "@/components/dashboard/ActiveTrackBar";
import { ModuleCard, type Module } from "@/components/dashboard/ModuleCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export const metadata: Metadata = { title: "Dashboard" };

// Static placeholder data (UI-first) — replace with the dashboard-flow endpoint.
const MODULES: Module[] = [
  { id: "m1", index: 1, title: "Currency Pairs & Market Structure", lessonsLabel: "4 lessons", status: "done", progress: 100 },
  { id: "m2", index: 2, title: "Pips, Lots & Leverage", lessonsLabel: "4 lessons", status: "done", progress: 100 },
  { id: "m3", index: 3, title: "Risk Management & Position Sizing", lessonsLabel: "6 of 9 lessons done", status: "in-progress", progress: 66 },
  { id: "m4", index: 4, title: "Technical Analysis & Entry Signals", lessonsLabel: "4 lessons", status: "locked", progress: 0 },
  { id: "m5", index: 5, title: "Trading Psychology", lessonsLabel: "4 lessons", status: "locked", progress: 0 },
  { id: "m6", index: 6, title: "Building a Trading System", lessonsLabel: "4 lessons", status: "locked", progress: 0 },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
      <WelcomeHero />
      <ActiveTrackBar />

      <section className="flex flex-col gap-5">
        <h2 className="font-cormorant text-2xl font-semibold text-teal">
          Modules in Forex Trading
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      <RecentActivity />
    </div>
  );
}
