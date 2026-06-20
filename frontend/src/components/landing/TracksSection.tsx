"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Coins, GitFork, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "all" | "finance" | "programming";

const TRACKS: {
  id: string;
  category: Category;
  categoryLabel: string;
  icon: string | LucideIcon;
  title: string;
  desc: string;
  lessons: number;
}[] = [
  {
    id: "python",
    category: "programming",
    categoryLabel: "Programming & AI",
    icon: "</>",
    title: "Python",
    desc: "Variables to OOP, APIs, data structures, algorithms, async Python, to production system design and deployment.",
    lessons: 24,
  },
  {
    id: "forex",
    category: "finance",
    categoryLabel: "Finance & Trading",
    icon: "↗",
    title: "Forex Trading",
    desc: "Currency markets, chart patterns, risk management, to building a systematic trading strategy with backtesting.",
    lessons: 18,
  },
  {
    id: "web-dev",
    category: "programming",
    categoryLabel: "Programming & AI",
    icon: Globe,
    title: "Web Development",
    desc: "HTML/CSS/JS fundamentals, React, REST APIs, databases, authentication, CI/CD, to scalable full-stack architecture.",
    lessons: 26,
  },
  {
    id: "crypto",
    category: "finance",
    categoryLabel: "Finance & Trading",
    icon: Coins,
    title: "Crypto & Blockchain",
    desc: "Blockchain fundamentals, DeFi protocols, on-chain analysis, derivatives, to building trading bots.",
    lessons: 16,
  },
  {
    id: "ai-engineering",
    category: "programming",
    categoryLabel: "Programming & AI",
    icon: GitFork,
    title: "AI & Machine Learning",
    desc: "What AI is, supervised learning, model training, deep learning, neural networks, transformers, to fine-tuning LLMs.",
    lessons: 22,
  },
  {
    id: "stocks",
    category: "finance",
    categoryLabel: "Finance & Trading",
    icon: Landmark,
    title: "Personal Finance",
    desc: "Budgeting, debt management, investment vehicles, tax-advantaged accounts, to a complete personal wealth system.",
    lessons: 14,
  },
];

const FILTERS: { id: Category; label: string }[] = [
  { id: "all",         label: "All 12 tracks" },
  { id: "finance",     label: "Finance & Trading" },
  { id: "programming", label: "Programming & AI" },
];

function TrackIcon({ icon }: { icon: string | LucideIcon }) {
  if (typeof icon === "string") return <span>{icon}</span>;
  const Icon = icon;
  return <Icon size={18} color="#21494A" strokeWidth={1.5} />;
}

export function TracksSection() {
  const [active, setActive] = useState<Category>("all");
  const visible = TRACKS.filter((t) => active === "all" || t.category === active);

  return (
    <section id="tracks" className="py-20 bg-[#EDE8DC]">
      <div className="mx-auto max-w-315.5 px-6 flex flex-col gap-13">

        {/* Header */}
        <div className="flex flex-col gap-4 max-w-[758px]">
          <p className="font-syne font-normal text-2xl uppercase tracking-widest text-teal">
            What you&apos;ll learn
          </p>
          <h2 className="font-cormorant text-[52px] font-medium leading-[1.08] text-black">
            <span className="font-cormorant italic text-teal">
              12 tracks.
            </span>
            {" "}Pick exactly
            <br />
            what you want to master.
          </h2>
          <p className="font-syne font-normal text-[20px] leading-relaxed text-charcoal">
            Every track is independent. You pick one track, your AI builds your personal curriculum
            around it, and you go from beginner to mastery at your own pace.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-6">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={cn(
                "font-syne font-normal transition-colors h-11.5 rounded-[24px] py-2.5 px-7 text-base",
                active === f.id
                  ? "bg-[#1B3829] text-white"
                  : "bg-white text-charcoal border-[0.5px] border-[#E2DDD4]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Track cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map((track) => (
            <div
              key={track.id}
              className="rounded-xl flex flex-col bg-white border border-[#E2DDD4] p-[26px]"
            >
              {/* Category */}
              <p className="font-syne font-normal text-base uppercase tracking-wider text-stone">
                {track.categoryLabel}
              </p>

              {/* Icon */}
              <div className="flex items-center justify-center rounded-md w-10 h-10 mt-3 border border-[#E2DDD4] bg-off-white text-sm text-teal shrink-0">
                <TrackIcon icon={track.icon} />
              </div>

              {/* Title */}
              <p className="font-syne font-medium text-xl text-black mt-3">
                {track.title}
              </p>

              {/* Description */}
              <p className="font-syne font-normal text-base text-charcoal mt-3 leading-normal line-clamp-3">
                {track.desc}
              </p>

              {/* Divider */}
              <div className="mt-5 border-t-[0.5px] border-silver" />

              {/* Footer */}
              <div className="flex items-center justify-between mt-3">
                <span className="font-syne font-normal text-xs text-teal">
                  Beginner → Mastery
                </span>
                <span className="flex items-center justify-center rounded-full font-syne font-normal h-[37px] px-4 text-sm text-teal bg-off-white border border-[#E2DDD4]">
                  {track.lessons} Lessons
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Browse all CTA */}
        <div className="flex justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center font-syne font-normal transition-colors bg-teal text-blush text-base h-11.5 px-8"
          >
            Browse all 12 tracks here
          </Link>
        </div>

      </div>
    </section>
  );
}
