"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RadioDot } from "./RadioDot";

type Course = { id: string; name: string; blurb: string };
type Category = {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  courses: Course[];
};

export type SelectedCourse = { id: string; name: string };

// Static for now (UI-first). Swap to the backend "subjects" endpoint later.
// NOTE: this is broader than the 4 fixed MVP tracks in CLAUDE.md — reconcile
// the real selectable set when wiring the backend.
const CATEGORIES: Category[] = [
  {
    id: "finance",
    name: "Finance & Trading",
    icon: "£",
    blurb: "Forex, stocks, crypto, options",
    courses: [
      { id: "stocks", name: "Stock Market", blurb: "Fundamentals to quantitative analysis" },
      { id: "forex", name: "Forex Trading", blurb: "Currency markets to systematic strategy" },
      { id: "crypto", name: "Crypto & Blockchain", blurb: "Wallets to DeFi and trading bots" },
      { id: "personal-finance", name: "Personal Finance", blurb: "Budgeting to wealth systems" },
    ],
  },
  {
    id: "programming",
    name: "Programming & AI",
    icon: "</>",
    blurb: "Python, web dev, AI engineering",
    courses: [
      { id: "python", name: "Python", blurb: "Fundamentals to advanced scripting" },
      { id: "web-development", name: "Web Development", blurb: "Frontend to full-stack apps" },
      { id: "ai-ml", name: "AI & Machine Learning", blurb: "Models, training and deployment" },
      { id: "ai-engineering", name: "AI Engineering", blurb: "LLM apps, agents and RAG" },
      { id: "cybersecurity", name: "Cybersecurity", blurb: "Offensive and defensive security" },
      { id: "dsa", name: "Data Structures & Algorithms", blurb: "Core CS and interview prep" },
    ],
  },
];

export function SubjectSelection({
  onContinue,
}: {
  onContinue: (course: SelectedCourse) => void;
}) {
  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id);
  const [courseId, setCourseId] = useState<string | null>(CATEGORIES[0].courses[0].id);

  const activeCategory =
    CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];

  function selectCategory(id: string) {
    if (id === categoryId) return;
    setCategoryId(id);
    setCourseId(null); // reset course choice when switching category
  }

  function handleContinue() {
    const course = activeCategory.courses.find((c) => c.id === courseId);
    if (!course) return;
    onContinue({ id: course.id, name: course.name });
  }

  return (
    <div data-theme="auth" className="flex flex-col gap-6">
      {/* Header */}
      <div className="pr-10">
        <h1 className="font-cormorant font-semibold text-[28px] leading-tight text-teal">
          Choose your subject
        </h1>
        <p className="mt-1 text-sm font-normal text-stone">
          What do you want to master? You can add more subjects later.
        </p>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const selected = cat.id === categoryId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat.id)}
              className={cn(
                "flex flex-col gap-6 rounded-xl border bg-white p-4 text-left transition-colors",
                selected ? "border-teal" : "border-silver/60 hover:border-stone"
              )}
            >
              <div className="flex items-start justify-between">
                <span className="font-syne text-lg text-charcoal">{cat.icon}</span>
                <RadioDot selected={selected} />
              </div>
              <div>
                <p className="font-syne font-semibold text-base text-teal">
                  {cat.name}
                </p>
                <p className="mt-1 text-xs text-stone">{cat.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Course list for the active category */}
      <ul className="flex flex-col gap-3">
        {activeCategory.courses.map((course) => {
          const selected = course.id === courseId;
          return (
            <li key={course.id}>
              <button
                type="button"
                onClick={() => setCourseId(course.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3.5 text-left transition-colors",
                  selected ? "border-teal" : "border-silver/60 hover:border-stone"
                )}
              >
                <div>
                  <p className="font-syne font-medium text-sm text-teal">
                    {course.name}
                  </p>
                  <p className="mt-0.5 text-xs text-stone">{course.blurb}</p>
                </div>
                <RadioDot selected={selected} />
              </button>
            </li>
          );
        })}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!courseId}
        className="h-12.25 w-full rounded-md bg-teal font-syne text-base text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Choose this track
      </button>
    </div>
  );
}
