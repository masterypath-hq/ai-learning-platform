import Link from "next/link";
import { cn } from "@/lib/utils";

type Activity = {
  id: string;
  time: string;
  title: React.ReactNode;
  subtitle: string;
  tone: "teal" | "dark" | "muted";
};

const ACTIVITIES: Activity[] = [
  {
    id: "lesson-risk",
    time: "2 hours ago",
    title: "Completed lesson: Risk Management Strategies",
    subtitle: "Forex Trading — Intermediate",
    tone: "teal",
  },
  {
    id: "quiz-ta",
    time: "Yesterday",
    title: (
      <>
        Scored <span className="text-teal">92%</span> in Technical Analysis Quiz
      </>
    ),
    subtitle: "Earned 250XP and 'Sharp Eye' Badge",
    tone: "dark",
  },
  {
    id: "goal-sept",
    time: "2 days ago",
    title: "Updated Study Goal for September",
    subtitle: "New target: 15 hours per week",
    tone: "muted",
  },
];

const TONE_DOT: Record<Activity["tone"], string> = {
  teal: "bg-teal-light",
  dark: "bg-teal",
  muted: "bg-charcoal",
};

export function RecentActivity() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-2xl font-semibold text-teal">
          Recent Activity
        </h2>
        <Link
          href="/progress"
          className="text-sm text-teal-dark underline underline-offset-2 transition-colors hover:text-teal"
        >
          View Full Timeline
        </Link>
      </div>

      <ul className="flex flex-col gap-6">
        {ACTIVITIES.map((activity) => (
          <li key={activity.id} className="flex items-start gap-4">
            <span className="w-20 shrink-0 pt-0.5 text-xs text-stone">
              {activity.time}
            </span>
            <span
              className={cn(
                "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                TONE_DOT[activity.tone]
              )}
            />
            <div>
              <p className="text-sm font-medium text-charcoal">{activity.title}</p>
              <p className="mt-0.5 text-xs text-stone">{activity.subtitle}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
