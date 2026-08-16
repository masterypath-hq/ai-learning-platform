/**
 * Prompts for AI course-content generation (Stage 4). Programming & AI Engineering
 * tracks only — see CLAUDE.md for the finance-track risk-disclaimer rules that will
 * apply once finance tracks are seeded and this prompt set is extended for them.
 */
import { findTrack } from "@ai-learning-platform/shared";

const RESPONSE_RULES = `You MUST respond with ONLY valid JSON — no markdown code fences, no explanation, no extra text before or after the JSON.`;

const NATIVE_MOBILE_RULES: Record<string, string> = {
  "mobile-android": `Native platform requirement: ALL code examples MUST be Kotlin using Jetpack Compose — no exceptions.
Cross-platform frameworks (Flutter, React Native, etc.) may appear only as a single one-line
"what we're deliberately not using and why" remark, never as example code.`,
  "mobile-ios": `Native platform requirement: ALL code examples MUST be Swift using SwiftUI — no exceptions.
Cross-platform frameworks (Flutter, React Native, etc.) may appear only as a single one-line
"what we're deliberately not using and why" remark, never as example code.`,
};

const TRACK_SAFETY_RULES: Record<string, string> = {
  cybersecurity: `Offensive-security authorization principle (non-negotiable): the career outcome of this
track is penetration tester / security engineer / bug-bounty hunter — a professional who only ever
tests systems they are AUTHORIZED to test. Every technique, worked example, and exercise MUST target
one of these legal practice targets ONLY, named explicitly rather than invented: the learner's own
local lab (VMs, Docker), intentionally vulnerable practice apps (DVWA, OWASP Juice Shop, WebGoat,
PortSwigger Web Security Academy, Hack The Box, TryHackMe), or in-scope bug-bounty programs. Never
generate instructions, payloads, or exercises aimed at a specific real-world system, person, or
company the learner does not own or have written permission to test. The foundation phase MUST
include a module/lesson on the law and ethics of hacking — authorization, scope, rules of
engagement, and responsible disclosure — framed as the skill that separates a paid professional
from a criminal and what employers and visa sponsors require. The mastery phase MUST include both
(a) AI-era security — testing AI/LLM-powered apps for prompt injection, insecure tool use, and data
leakage per the OWASP LLM Top 10 — and (b) a concrete career module: portfolio building, a
certification path (eJPT toward OSCP), and landing the first pentest role or first paid bounty.`,
};

function trackSafetyRule(trackSlug: string): string {
  const rule = TRACK_SAFETY_RULES[trackSlug];
  return rule ? `\n\n${rule}` : "";
}

function masteryPathGroundingBlock(trackSlug: string): string {
  const track = findTrack(trackSlug);
  if (!track?.masteryPath) return "";
  const { beginner, intermediate, advanced, mastery } = track.masteryPath;
  return `\n\nGround the four phases in this learner-tested curriculum outline — personalize within it, not off-script:
- Foundation: ${beginner}
- Intermediate: ${intermediate}
- Advanced: ${advanced}
- Mastery: ${mastery}`;
}

function nativeMobileRule(trackSlug: string): string {
  const rule = NATIVE_MOBILE_RULES[trackSlug];
  return rule ? `\n\n${rule}` : "";
}

export function buildCourseOutlinePrompt(
  trackSlug: string,
  title: string,
  description: string
): { system: string; user: string } {
  const system = `You are an expert curriculum designer building a world-class AI-powered learning platform.
Your task is to design the full module outline for a course that serves learners from complete
beginner through mastery. The course has exactly four phases, in order: foundation, intermediate,
advanced, mastery. Every phase must be covered by at least one module so a learner placed into any
phase always has content.

Programming & AI Engineering content requirements:
- All code examples must be runnable, copy-paste ready, and syntactically correct for the
  language's current stable version.
- Use practical, real-world use cases.
${masteryPathGroundingBlock(trackSlug)}${nativeMobileRule(trackSlug)}${trackSafetyRule(trackSlug)}

${RESPONSE_RULES}
The JSON must exactly match this structure:
{
  "learningObjectives": ["string — 3 to 5 specific, measurable outcomes for the whole course"],
  "prerequisites": ["string — prior knowledge required, or empty array if none"],
  "modules": [
    {
      "phase": "foundation" | "intermediate" | "advanced" | "mastery",
      "title": "string — module title",
      "description": "string — 1-2 sentence module summary",
      "keyConcepts": ["string — 3 to 6 key concepts covered"],
      "durationWeeks": number
    }
  ]
}
Generate 6 to 10 modules total, ordered foundation → mastery, each building logically on the last.`;

  const user = `Create the module outline for:
Track: ${trackSlug}
Course title: ${title}
Course description: ${description}`;

  return { system, user };
}

export function buildModuleLessonsPrompt(
  trackSlug: string,
  module: { phase: string; title: string; description: string; keyConcepts: string[] }
): { system: string; user: string } {
  const system = `You are an expert content creator for a world-class AI learning platform.
Your task is to generate detailed lesson content for one course module.

All code in workedExamples and practiceExercise must be runnable with inline comments explaining
each step. explanationContent must be markdown formatted and at least 300 words.
${nativeMobileRule(trackSlug)}${trackSafetyRule(trackSlug)}

${RESPONSE_RULES}
The JSON must exactly match this structure:
{
  "lessons": [
    {
      "title": "string",
      "explanationContent": "string — markdown formatted lesson content, minimum 300 words",
      "keyTakeaways": ["string — 3 to 5 key takeaways"],
      "durationMins": number,
      "workedExamples": [
        {
          "title": "string",
          "content": "string — explanation of the example",
          "solution": "string — complete runnable code with inline comments"
        }
      ],
      "practiceExercise": {
        "title": "string",
        "prompt": "string — clear exercise instructions",
        "hints": ["string — 2 to 3 progressive hints"],
        "sampleSolution": "string — complete runnable code solution"
      }
    }
  ]
}
Generate 3 to 5 lessons. Each lesson needs 2 to 3 worked examples and exactly one practice exercise.`;

  const user = `Generate lessons for this module:
Track: ${trackSlug}
Phase: ${module.phase}
Module title: ${module.title}
Module description: ${module.description}
Key concepts: ${module.keyConcepts.join(", ")}`;

  return { system, user };
}
