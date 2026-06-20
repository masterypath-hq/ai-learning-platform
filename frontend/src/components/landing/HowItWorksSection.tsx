import { User, Star, MessageSquare, CheckCircle } from "lucide-react";

const STEPS = [
  {
    id: "goal",
    n: "1",
    Icon: User,
    title: "Tell us your goal",
    desc: "Choose Finance or Programming. Pick your track. Tell us your level in 60 seconds. That's all the AI needs to get started.",
  },
  {
    id: "curriculum",
    n: "2",
    Icon: Star,
    title: "AI builds your curriculum",
    desc: "In seconds, your tutor researches 30+ sources and generates a full personalized course — structured modules, lessons, and exercises calibrated exactly to you.",
  },
  {
    id: "conversation",
    n: "3",
    Icon: MessageSquare,
    title: "Learn through conversation",
    desc: "Your AI tutor doesn't just answer — it challenges you, asks questions back, and adapts to your pace. Every session ends with a summary saved to your memory.",
  },
  {
    id: "certify",
    n: "4",
    Icon: CheckCircle,
    title: "Track, quiz, certify",
    desc: "Adaptive quizzes after every lesson. Module exams with cooldowns. A streak that keeps you honest. A certificate when you're done.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="mx-auto max-w-315.5 px-6 flex flex-col gap-13">

        {/* Header */}
        <div className="flex flex-col gap-4 max-w-[758px]">
          <p className="font-syne font-normal text-2xl uppercase tracking-widest text-teal">
            How it works
          </p>
          <h2 className="font-cormorant text-[52px] font-medium leading-[1.08] text-black">
            Four steps from
            <br />
            signup to{" "}
            <span className="font-cormorant italic text-teal">
              mastery.
            </span>
          </h2>
          <p className="font-syne font-normal text-[20px] leading-relaxed text-charcoal">
            The average person trying to learn Forex or Python uses 5–7 different tools. None of
            <br />
            them talk to each other. None of them remember you.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className="rounded-xl flex flex-col gap-3 bg-off-white p-6 min-h-48"
            >
              {/* Icon + number row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center rounded w-8 h-8 bg-[#CFF1F1]">
                  <step.Icon size={20} color="#21494a" strokeWidth={1.5} />
                </div>
                <span className="font-cormorant font-semibold text-[32px] text-silver leading-none">
                  {step.n}
                </span>
              </div>
              {/* Title */}
              <p className="font-syne font-medium text-xl text-black">
                {step.title}
              </p>
              {/* Description */}
              <p className="font-syne font-normal text-sm leading-relaxed text-charcoal">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
