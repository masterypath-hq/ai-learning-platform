/**
 * Prompts for AI course-content generation (Stage 4). Programming & AI Engineering
 * tracks only — see CLAUDE.md for the finance-track risk-disclaimer rules that will
 * apply once finance tracks are seeded and this prompt set is extended for them.
 */

const RESPONSE_RULES = `You MUST respond with ONLY valid JSON — no markdown code fences, no explanation, no extra text before or after the JSON.`;

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
