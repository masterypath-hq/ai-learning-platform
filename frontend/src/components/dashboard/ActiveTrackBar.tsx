import Link from "next/link";

const PROGRESS = 34;

export function ActiveTrackBar() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-divider bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
      {/* Left — track */}
      <div className="flex items-center gap-4">
        <span className="h-12 w-12 shrink-0 rounded-lg bg-teal" />
        <div>
          <p className="text-xs text-stone">Active track</p>
          <p className="font-cormorant text-xl font-semibold text-teal">
            Forex Trading — Intermediate
          </p>
        </div>
      </div>

      {/* Right — progress */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="text-right">
          <p className="text-xs text-stone">Overall progress</p>
          <p className="text-sm font-semibold text-charcoal">{PROGRESS}% complete</p>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-divider">
            <div
              className="h-full rounded-full bg-teal"
              style={{ width: `${PROGRESS}%` }}
            />
          </div>
          <p className="text-xs text-stone">6 of 18 lessons done</p>
        </div>
        <Link
          href="/onboarding"
          className="text-sm text-teal-dark underline underline-offset-2 transition-colors hover:text-teal"
        >
          Switch track
        </Link>
      </div>
    </section>
  );
}
