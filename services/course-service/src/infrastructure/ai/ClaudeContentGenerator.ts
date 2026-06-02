import Anthropic from "@anthropic-ai/sdk";
import type { IAIContentGenerator, CourseOutline, ModuleLessonsResult, GenerateCourseOutlineParams, GenerateModuleLessonsParams } from "../../application/interfaces/IAIContentGenerator.js";
import { Subject, CourseLevel } from "@ai-learning-platform/shared";

const MODEL = "claude-sonnet-4-6";
const MAX_RETRIES = 2;

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function getLevelDescriptor(level: CourseLevel): string {
  switch (level) {
    case CourseLevel.BEGINNER:
      return "complete beginner — explain every concept from first principles, assume zero prior knowledge, use everyday analogies";
    case CourseLevel.INTERMEDIATE:
      return "intermediate learner — learner has basic familiarity, focus on deepening understanding and practical application";
    case CourseLevel.ADVANCED:
      return "advanced practitioner — learner is experienced, focus on nuance, edge cases, and professional-grade depth";
    case CourseLevel.MASTERY:
      return "mastery-level student — institutional depth, cutting-edge techniques, assume expert background, challenge assumptions";
  }
}

function getSubjectGuidance(subject: Subject): string {
  if (subject === Subject.FINANCE) {
    return `Finance & Trading content requirements:
- Ground all content against established frameworks: CFA curriculum, CMT framework, FRM standards where relevant.
- Every strategy or investment advice implication MUST include a risk disclaimer.
- Do not speculate on live market prices or make specific return predictions.
- Use real-world market scenarios for examples but clearly label them as educational illustrations.`;
  }
  return `Programming & AI Engineering content requirements:
- All code examples must be runnable, copy-paste ready, and include inline comments explaining each step.
- Verify that code examples are syntactically correct for the language's current stable version.
- Use practical, real-world use cases for examples.
- For AI/ML content, include both conceptual explanations and hands-on implementation.`;
}

/**
 * Calls the Anthropic Claude API to generate structured course content.
 * Strips markdown fences before JSON.parse. Retries up to MAX_RETRIES times.
 * (SOLID: S — single responsibility for AI generation.)
 */
export class ClaudeContentGenerator implements IAIContentGenerator {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateCourseOutline(params: GenerateCourseOutlineParams): Promise<CourseOutline> {
    const systemPrompt = `You are an expert curriculum designer building a world-class AI-powered learning platform.
Your task is to create a structured course outline in JSON.

Target learner: ${getLevelDescriptor(params.level)}
${getSubjectGuidance(params.subject)}
${params.userBackground ? `Learner background context: ${params.userBackground}` : ""}

You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text.
The JSON must exactly match this structure:
{
  "title": "string — concise, specific course title",
  "description": "string — 2-3 sentence course description",
  "learningObjectives": ["string — 3 to 5 specific, measurable outcomes"],
  "prerequisites": ["string — list of prior knowledge required, or empty array if none"],
  "estimatedDurationMinutes": number,
  "modules": [
    {
      "theme": "string — module theme/title",
      "keyConcepts": ["string — 3 to 6 key concepts covered"],
      "estimatedDurationMinutes": number
    }
  ]
}
Generate 4 to 6 modules. Each module should build logically on the previous one.`;

    const userMessage = `Create a course outline for:
Subject: ${params.subject}
Track: ${params.track}
Level: ${params.level}`;

    const raw = await this.callWithRetry(systemPrompt, userMessage);
    return JSON.parse(raw) as CourseOutline;
  }

  async generateModuleLessons(params: GenerateModuleLessonsParams): Promise<ModuleLessonsResult> {
    const isFinance = params.subject === Subject.FINANCE;
    const educationalDisclaimer = isFinance
      ? `\n\nEDUCATIONAL DISCLAIMER: This content is for educational purposes only and does not constitute financial advice. Past performance does not guarantee future results. Always consult a qualified financial professional before making investment decisions.`
      : "";

    const systemPrompt = `You are an expert content creator for a world-class AI learning platform.
Your task is to generate detailed lesson content for a course module in JSON.

Target learner: ${getLevelDescriptor(params.level)}
${getSubjectGuidance(params.subject)}
${isFinance ? "IMPORTANT: Every lesson's explanationContent must end with the required educational disclaimer." : "IMPORTANT: All code in workedExamples must be runnable with inline comments."}

You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text.
The JSON must exactly match this structure:
{
  "lessons": [
    {
      "title": "string",
      "explanationContent": "string — markdown formatted lesson content (minimum 300 words)${isFinance ? `. Must end with: ${educationalDisclaimer}` : ""}",
      "keyTakeaways": ["string — 3 to 5 key takeaways"],
      "estimatedDurationMinutes": number,
      "workedExamples": [
        {
          "title": "string",
          "content": "string — explanation of the example",
          "solution": "string — ${isFinance ? "worked solution with calculations" : "complete runnable code with inline comments"}"
        }
      ],
      "practiceExercise": {
        "title": "string",
        "prompt": "string — clear exercise instructions",
        "hints": ["string — 2 to 3 progressive hints"],
        "sampleSolution": "string — ${isFinance ? "detailed solution walkthrough" : "complete runnable code solution"}"
      }
    }
  ]
}
Generate 3 to 5 lessons. Each lesson should have 2 to 3 worked examples.`;

    const userMessage = `Generate lessons for this module:
Subject: ${params.subject}
Track: ${params.track}
Level: ${params.level}
Module Theme: ${params.moduleTheme}
Key Concepts: ${params.keyConcepts.join(", ")}`;

    const raw = await this.callWithRetry(systemPrompt, userMessage);
    return JSON.parse(raw) as ModuleLessonsResult;
  }

  private async callWithRetry(systemPrompt: string, userMessage: string): Promise<string> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });

        const content = response.content[0];
        if (content.type !== "text") {
          throw new Error("Unexpected non-text response from Claude");
        }

        return stripMarkdownFences(content.text);
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          console.warn(`[ClaudeContentGenerator] Attempt ${attempt + 1} failed, retrying...`, err);
        }
      }
    }
    throw lastError;
  }
}
