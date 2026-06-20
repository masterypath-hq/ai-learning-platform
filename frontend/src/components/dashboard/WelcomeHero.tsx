import Link from "next/link";
import { ArrowRight, Flame, Clock, Award, type LucideIcon } from "lucide-react";

type Stat = { id: string; label: string; value: string; icon: LucideIcon; iconColor: string };

const STATS: Stat[] = [
  { id: "streak", label: "Learning streak", value: "14 days", icon: Flame, iconColor: "text-orange-400" },
  { id: "time", label: "Time learned", value: "12h 45m", icon: Clock, iconColor: "text-teal-light" },
  { id: "score", label: "Avg. quiz score", value: "88%", icon: Award, iconColor: "text-teal-light" },
];

export function WelcomeHero() {
  return (
    <section className="flex flex-col gap-8 rounded-2xl bg-teal p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}
      <div className="flex flex-col items-start gap-4">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/80">
          AI-Powered Tutoring Path
        </span>
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-white">
            Keep going, Tolu.
          </h1>
          <p className="mt-1 font-cormorant text-2xl text-white/70">
            You&apos;re building something real.
          </p>
        </div>
        <Link
          href="/session/continue"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-cream px-5 py-3 text-sm font-medium text-teal transition-colors hover:bg-white"
        >
          Continue Learning
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Right: stats */}
      <div className="grid w-full grid-cols-3 gap-3 lg:w-auto">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 lg:min-w-[116px]"
            >
              <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
