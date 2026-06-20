const BULLETS = [
  { id: "pinecone",   text: "Pinecone vector memory — semantic retrieval" },
  { id: "spaced-rep", text: "Spaced repetition — weak concepts resurface automatically" },
  { id: "transparent",text: "Full transparency — view, edit and delete your memory anytime" },
];

export function MemorySection() {
  return (
    <section className="py-20 bg-teal">
      <div className="mx-auto max-w-315.5 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — text */}
          <div className="flex flex-col gap-6">
            <p className="font-syne font-normal text-2xl uppercase tracking-widest text-white/55">
              The Memory System
            </p>

            <h2 className="font-cormorant text-[52px] font-medium leading-[1.08] text-white">
              An AI that actually
              <br />
              <span className="font-cormorant italic text-teal-light">
                remembers you.
              </span>
            </h2>

            <p className="font-syne font-normal text-[20px] leading-relaxed text-white/75">
              After every session, your tutor writes a structured memory entry — what you
              understood, where you struggled, what to revisit. Every new session starts with
              those memories loaded in. The longer you use MasteryPath, the more
              irreplaceable it becomes.
            </p>

            <ul className="flex flex-col gap-3">
              {BULLETS.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-teal-light" />
                  <span className="font-syne font-normal text-base text-white/75">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — memory card mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">

              {/* Back cards (stacked depth effect) */}
              <div className="absolute inset-x-6 top-3 h-full rounded-2xl bg-white/15" />
              <div className="absolute inset-x-3 top-1.5 h-full rounded-2xl bg-white/25" />

              {/* Front card */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">

                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-3 bg-teal">
                  <p className="font-syne font-normal text-[11px] uppercase tracking-wider text-white/85">
                    Session Memory · Today
                  </p>
                  <span className="rounded-full font-syne font-normal px-2 py-0.5 text-[10px] text-white/70 bg-white/15">
                    Saved · 9 min ago
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <p className="font-syne font-normal text-[13px] leading-relaxed text-charcoal">
                    Strong session. Nailed the 1% rule and connected it to stop-loss
                    placement. Ready to move to R:R ratios. Ask about the asymmetric
                    trade setup next time.
                  </p>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 border-t border-[#F0EBE3]">
                  <p className="font-syne font-normal text-[11px] text-[#9CA3AF]">
                    Forex Trading · Lesson 9
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
