import { cn } from "@/lib/utils";

const TOOLS = [
  {
    id: "youtube-intro",
    tag: "• YOUTUBE",
    feature: "Watch intro content",
    desc: "Unstructured, no progression. Algorithm pulls you off-topic. No one tracks what you watched.",
    highlight: false,
  },
  {
    id: "chatgpt",
    tag: "• CHATGPT / CLAUDE",
    feature: "Ask follow-up questions",
    desc: "Zero memory of what you already learned. No curriculum context. Starts from scratch every session.",
    highlight: false,
  },
  {
    id: "udemy",
    tag: "• UDEMY / COURSEA",
    feature: "Buy a structured course",
    desc: "Pre-recorded, no personalization, fixed pace. 90% of buyers never finish. No one notices if you stop.",
    highlight: false,
  },
  {
    id: "youtube-search",
    tag: "• YOUTUBE",
    feature: "Search for clarification",
    desc: "Conflicting answers, no synthesis. You lose 20 minutes on a 2-minute question every time",
    highlight: false,
  },
  {
    id: "quiz-sites",
    tag: "• RANDOM QUIZ SITES",
    feature: "Take practice quizzes",
    desc: "No connection to what you actually learned. Generic questions that don't adapt to your level.",
    highlight: false,
  },
  {
    id: "masterypath",
    tag: "• MASTERYPATH",
    feature: "All of it. One place.\nOne AI that knows you.",
    desc: "Personalized curriculum. Memory that compounds. Quizzes built from what you've actually learned.",
    highlight: true,
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 bg-[#EBE1CF]">
      <div className="mx-auto max-w-[1262px] px-6 flex flex-col gap-[52px]">

        {/* Header */}
        <div className="flex flex-col gap-4">
          <p className="font-syne font-normal text-2xl uppercase tracking-widest text-teal">
            The Problem
          </p>
          <h2 className="font-cormorant text-[52px] font-medium leading-[1.08] text-black">
            Learning today is{" "}
            <span className="font-cormorant italic text-teal">
              broken
            </span>
            <br />
            and fragmented.
          </h2>
          <p className="font-syne font-normal text-[20px] leading-relaxed text-charcoal">
            The average person trying to learn Forex or Python uses 5–7 different tools. None of
            <br />
            them talk to each other. None of them remember you.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              className={cn(
                "rounded-xl flex flex-col justify-start min-h-[192px] p-[27px]",
                tool.highlight ? "bg-[#1B3829]" : "bg-white"
              )}
            >
              <div className="flex flex-col gap-2 max-w-[346px]">
                <p className={cn(
                  "font-syne font-normal text-base",
                  tool.highlight ? "text-white/60" : "text-stone"
                )}>
                  {tool.tag}
                </p>
                <p className={cn(
                  "font-syne font-medium text-xl whitespace-pre-line",
                  tool.highlight ? "text-white" : "text-black"
                )}>
                  {tool.feature}
                </p>
                <p className={cn(
                  "font-syne font-normal text-base leading-relaxed",
                  tool.highlight ? "text-white/70" : "text-charcoal"
                )}>
                  {tool.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
