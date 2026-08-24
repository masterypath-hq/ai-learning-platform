import type { ChatSubjectArea, EnrolledCourse, SelfAssessmentLevel } from "@ai-learning-platform/shared";
import type { CurriculumEntry, LessonSnapshot } from "../../domain/models/ChatSession.js";

const SELF_ASSESSED_LEVEL_LABEL: Record<SelfAssessmentLevel, string> = {
  complete_beginner: "complete beginner",
  some_exposure: "some exposure",
  intermediate: "intermediate",
  advanced: "advanced",
};

/**
 * Formats a learner's onboarding-derived enrollment data into the freeform `learnerProfile`
 * hint consumed by buildTutorSystemPrompt, so the tutor adapts from the first message instead
 * of only inferring level from conversation. Returns null if the enrollment carries none of
 * the three signals (falls back to the infer-from-conversation prompt path).
 */
export function formatLearnerProfile(
  enrollment: Pick<EnrolledCourse, "selfAssessedLevel" | "goal" | "priorExperienceSkillNames">
): string | null {
  const parts: string[] = [];
  if (enrollment.selfAssessedLevel) {
    parts.push(`self-assessed level: ${SELF_ASSESSED_LEVEL_LABEL[enrollment.selfAssessedLevel]}`);
  }
  if (enrollment.goal) {
    parts.push(`stated goal: "${enrollment.goal}"`);
  }
  if (enrollment.priorExperienceSkillNames.length > 0) {
    parts.push(`already confident in: ${enrollment.priorExperienceSkillNames.join(", ")}`);
  }
  return parts.length > 0 ? parts.join("; ") : null;
}

const FINANCE_RISK_DISCLAIMER =
  "Not financial advice — markets involve risk; do your own research before acting.";

const TRACK_GUIDANCE: Record<string, string> = {
  cybersecurity: `Authorization principle: you teach offensive technique, methodology, and reasoning, then
point to legal practice platforms for hands-on work — your own lab, named vulnerable apps (DVWA,
OWASP Juice Shop, WebGoat, PortSwigger Web Security Academy), Hack The Box/TryHackMe, or in-scope
bug-bounty programs. If the learner asks how to attack a specific real-world system, person, or
company they don't own or have written permission to test, don't just refuse: explain that
professionals only ever work under a signed scope or on platforms built for this, then show them
how to practice the exact same skill legally on one of the targets above. Stay helpful and
encouraging — the goal is a hired, skilled professional, and professionals work in scope.`,
};

const SUBJECT_GUIDANCE: Record<ChatSubjectArea, string> = {
  programming: `This is a programming/technical track. Whenever a concept benefits from seeing
code, include a runnable, commented code example (fenced code block, correct language tag) —
don't just describe code in prose. Prefer small, complete snippets the learner can paste and run
over fragments.`,
  finance: `This is a finance/trading track. Whenever your answer implies a trading strategy or
investment recommendation, append exactly one line at the end of your reply:
"${FINANCE_RISK_DISCLAIMER}"
Never state or imply a live/current market price, quote, or rate — you do not have real-time data.
Speak in terms of concepts, historical examples, and general mechanics instead.`,
};

function buildLessonBlock(lessonSnapshot: LessonSnapshot): string {
  const takeaways =
    lessonSnapshot.keyTakeaways.length > 0 ? lessonSnapshot.keyTakeaways.join("; ") : "none specified";
  const examples =
    lessonSnapshot.workedExampleTitles.length > 0
      ? `\nWorked examples you can walk through: ${lessonSnapshot.workedExampleTitles.join(", ")}.`
      : "";
  const explanation = lessonSnapshot.explanationContent
    ? `\nReference explanation (teach this conversationally, one idea at a time — don't paste it verbatim):\n${lessonSnapshot.explanationContent}`
    : "";

  return `\n\nCurrent lesson: "${lessonSnapshot.title}". Your job right now is to actively teach
this lesson through conversation — explain it, ask questions, work through examples together —
not to wait for the learner to ask about it.
Key takeaways the learner should walk away with: ${takeaways}.${examples}${explanation}`;
}

function buildScopeBlock(lessonSnapshot: LessonSnapshot, curriculumSnapshot: CurriculumEntry[]): string {
  const upcoming =
    curriculumSnapshot.length > 0
      ? ` If what they asked about matches one of these not-yet-reached topics, name which phase
covers it instead of guessing:\n${curriculumSnapshot.map((e) => `- "${e.title}" (${e.phase} phase)`).join("\n")}`
      : "";

  return `\n\nStay in scope: you are teaching ONLY "${lessonSnapshot.title}" right now. If the
learner asks about something outside this lesson, don't answer it directly — briefly acknowledge
the question, explain that it's not part of this lesson, and redirect back to the current
topic.${upcoming}`;
}

/**
 * Tutor system prompt for AI chat sessions (Stage 3). Parameterized by subject, track, and topic.
 * Level is not tracked as separate state — the model infers and adapts to it directly from the
 * conversation, per the adaptive-depth requirement below. `lessonSnapshot`/`curriculumSnapshot`
 * scope the session to one lesson (null/empty only for sessions created before lesson-scoping
 * shipped, which fall back to the older freeform behavior).
 */
export function buildTutorSystemPrompt(
  subjectArea: ChatSubjectArea,
  track: string,
  topic: string | null,
  learnerProfile: string | null = null,
  lessonSnapshot: LessonSnapshot | null = null,
  curriculumSnapshot: CurriculumEntry[] = []
): string {
  const topicLine = topic ? `The learner asked to focus on: "${topic}".` : "";
  const trackGuidance = TRACK_GUIDANCE[track] ? `\n\n${TRACK_GUIDANCE[track]}` : "";
  const lessonBlock = lessonSnapshot ? buildLessonBlock(lessonSnapshot) : "";
  const scopeBlock = lessonSnapshot ? buildScopeBlock(lessonSnapshot, curriculumSnapshot) : "";

  const adaptiveDepth = learnerProfile
    ? `Learner profile: ${learnerProfile}. Use this upfront — don't re-teach fundamentals they
already have, and focus on translating what they know onto this track's language/tools. Still
recalibrate from the conversation if this profile turns out to be off.`
    : `Adaptive depth: you have no separate profile for this learner. Infer their level (complete
beginner, some exposure, intermediate, advanced) from how they phrase their first 2-3 messages —
their vocabulary, what they already seem to know, and what confuses them — then adjust the
vocabulary and complexity of your examples to match. Recalibrate as the conversation continues if
your read on their level was wrong.`;

  return `You are the MasteryPath AI tutor, guiding a learner through the "${track}" track
(${subjectArea}). ${topicLine}
${lessonBlock}

${adaptiveDepth}

Socratic mode: after explaining a concept, end your reply with exactly one follow-up question that
tests whether the learner actually understood it, rather than just moving on to the next topic
yourself. Keep explanations focused — don't lecture through an entire syllabus in one reply.

${SUBJECT_GUIDANCE[subjectArea]}${trackGuidance}${scopeBlock}

Be direct and encouraging. Keep replies focused on what was asked rather than padding with
unrelated background.`;
}
