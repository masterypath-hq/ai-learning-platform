/**
 * Prompts for quiz generation and short-answer grading (Stage 5).
 */

const RESPONSE_RULES = `You MUST respond with ONLY valid JSON — no markdown code fences, no explanation, no extra text before or after the JSON.`;

const QUESTION_SHAPE = `{
  "type": "mcq" | "short_answer",
  "prompt": "string — the question text",
  "options": ["string", "string", "string", "string"],  // mcq only, 3-5 options, omit for short_answer
  "correctAnswer": "string — for mcq, must exactly match one of options; for short_answer, the model/rubric answer",
  "explanation": "string — one to two sentences on why this is correct"
}`;

export function buildKnowledgeCheckPrompt(lesson: {
  title: string;
  explanationContent: string | null;
  keyTakeaways: string[];
}): { system: string; user: string } {
  const system = `You are an expert instructional designer writing a short formative knowledge check —
low-stakes, ungraded, meant to let a learner self-check understanding right after reading a lesson.

${RESPONSE_RULES}
The JSON must exactly match this structure:
{
  "questions": [${QUESTION_SHAPE}]
}
Generate 3 to 5 multiple-choice questions ("type" must be "mcq" for every question), grounded
strictly in the lesson content below — do not test anything not covered in it.`;

  const user = `Lesson: ${lesson.title}

${lesson.explanationContent ?? "(no written explanation on file)"}

Key takeaways:
${lesson.keyTakeaways.map((t) => `- ${t}`).join("\n")}`;

  return { system, user };
}

export function buildModuleQuizPrompt(
  module: { title: string; description: string | null; keyConcepts: string[] },
  lessons: { title: string; explanationContent: string | null; keyTakeaways: string[] }[]
): { system: string; user: string } {
  const system = `You are an expert instructional designer writing a graded module quiz. A learner passes at
70% correct. Questions must be answerable strictly from the module content below.

${RESPONSE_RULES}
The JSON must exactly match this structure:
{
  "questions": [${QUESTION_SHAPE}]
}
Generate 10 to 15 questions total, mixing "mcq" and "short_answer" (most should be mcq; include at
least 2 short_answer questions testing deeper understanding, not just recall). For short_answer
questions, "correctAnswer" is the rubric a grader will compare the learner's free-text answer against
— state what a correct answer must cover.`;

  const lessonsBlock = lessons
    .map(
      (l) => `### ${l.title}
${l.explanationContent ?? "(no written explanation on file)"}
Key takeaways: ${l.keyTakeaways.join("; ")}`
    )
    .join("\n\n");

  const user = `Module: ${module.title}
${module.description ?? ""}
Key concepts: ${module.keyConcepts.join(", ")}

${lessonsBlock}`;

  return { system, user };
}

export function buildCourseFinalPrompt(course: {
  title: string;
  learningObjectives: string[];
  modules: { title: string; description: string | null; keyConcepts: string[] }[];
}): { system: string; user: string } {
  const system = `You are an expert instructional designer writing a graded course final exam, covering the
whole course end to end. A learner passes at 70% correct.

${RESPONSE_RULES}
The JSON must exactly match this structure:
{
  "questions": [${QUESTION_SHAPE}]
}
Generate 10 to 15 questions total, mixing "mcq" and "short_answer" (most should be mcq; include at
least 3 short_answer questions), spanning every module listed below rather than clustering on one.
For short_answer questions, "correctAnswer" is the rubric a grader will compare the learner's
free-text answer against — state what a correct answer must cover.`;

  const modulesBlock = course.modules
    .map((m) => `### ${m.title}\n${m.description ?? ""}\nKey concepts: ${m.keyConcepts.join(", ")}`)
    .join("\n\n");

  const user = `Course: ${course.title}
Learning objectives:
${course.learningObjectives.map((o) => `- ${o}`).join("\n")}

${modulesBlock}`;

  return { system, user };
}

export function buildGradeShortAnswersPrompt(
  items: { questionId: string; prompt: string; correctAnswer: string; submittedAnswer: string }[]
): { system: string; user: string } {
  const system = `You are a strict but fair grader for short-answer quiz questions. For each item, compare the
learner's submitted answer against the rubric ("correctAnswer") and decide if it demonstrates the
required understanding — minor wording differences are fine, missing the core idea is not.

${RESPONSE_RULES}
The JSON must exactly match this structure:
{
  "results": [
    {
      "questionId": "string — copy from the input item",
      "correct": boolean,
      "feedback": "string — one to two sentences explaining the grading decision"
    }
  ]
}
Return exactly one result per input item, in any order, matched by questionId.`;

  const user = JSON.stringify({ items }, null, 2);

  return { system, user };
}
