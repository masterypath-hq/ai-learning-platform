const STATS = [
  { id: "tracks",  value: "12",  label: "Curated learning\ntracks" },
  { id: "sources", value: "30+", label: "Sources researched\nper course" },
  { id: "levels",  value: "4",   label: "Levels per track,\nbeginner to mastery" },
  { id: "memory",  value: "∞",   label: "AI memory — never\nforgets" },
];

export function StatsBar() {
  return (
    <section className="bg-teal-dark">
      <div className="mx-auto max-w-6xl px-6 py-21">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/15">
          {STATS.map((stat) => (
            <div key={stat.id} className="px-6 py-6 md:py-0 text-center first:pl-0 last:pr-0">
              <p className="font-cormorant font-semibold text-5xl leading-none text-teal-light">
                {stat.value}
              </p>
              <p className="mt-2 font-syne font-normal text-[22px] leading-snug whitespace-pre-line text-divider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
