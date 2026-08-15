/**
 * Knowledge check / module quiz / course final contracts (Stage 5). Zod-validated.
 */
import { z } from "zod";

export const QuizTypeSchema = z.enum(["knowledge_check", "module_quiz", "course_final"]);
export type QuizType = z.infer<typeof QuizTypeSchema>;

/** Types assessment-service tracks as graded attempts (knowledge checks are ungraded and never persisted). */
export const GradedQuizTypeSchema = z.enum(["module_quiz", "course_final"]);
export type GradedQuizType = z.infer<typeof GradedQuizTypeSchema>;

export const QuizQuestionTypeSchema = z.enum(["mcq", "short_answer"]);
export type QuizQuestionType = z.infer<typeof QuizQuestionTypeSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string(),
  type: QuizQuestionTypeSchema,
  prompt: z.string(),
  options: z.array(z.string()).optional(), // mcq only
  correctAnswer: z.string(),
  explanation: z.string(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

/** What Claude must produce for one question — same shape minus the server-assigned id. */
const GeneratedQuizQuestionObjectSchema = QuizQuestionSchema.omit({ id: true });
export const GeneratedQuizQuestionSchema = GeneratedQuizQuestionObjectSchema.refine(
  (q) => q.type !== "mcq" || (q.options !== undefined && q.options.includes(q.correctAnswer)),
  { message: "MCQ correctAnswer must be one of options" }
);
export type GeneratedQuizQuestion = z.infer<typeof GeneratedQuizQuestionSchema>;

const GeneratedMcqQuestionSchema = GeneratedQuizQuestionObjectSchema.extend({ type: z.literal("mcq") }).refine(
  (q) => q.options !== undefined && q.options.includes(q.correctAnswer),
  { message: "MCQ correctAnswer must be one of options" }
);

export const KnowledgeCheckGenerationSchema = z.object({
  questions: z.array(GeneratedMcqQuestionSchema).min(3).max(5),
});
export type KnowledgeCheckGeneration = z.infer<typeof KnowledgeCheckGenerationSchema>;

export const GradedQuizGenerationSchema = z.object({
  questions: z.array(GeneratedQuizQuestionSchema).min(10).max(15),
});
export type GradedQuizGeneration = z.infer<typeof GradedQuizGenerationSchema>;

export const GenerateQuizRequestSchema = z
  .object({
    lessonId: z.string().optional(),
    moduleId: z.string().optional(),
    courseId: z.string().optional(),
    type: QuizTypeSchema,
    userLevel: z.string().optional(),
  })
  .refine((v) => v.type !== "knowledge_check" || Boolean(v.lessonId), {
    message: "lessonId is required for knowledge_check",
  })
  .refine((v) => v.type !== "module_quiz" || Boolean(v.moduleId), {
    message: "moduleId is required for module_quiz",
  })
  .refine((v) => v.type !== "course_final" || Boolean(v.courseId), {
    message: "courseId is required for course_final",
  });
export type GenerateQuizRequest = z.infer<typeof GenerateQuizRequestSchema>;

export const GenerateQuizResponseSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});
export type GenerateQuizResponse = z.infer<typeof GenerateQuizResponseSchema>;

export const GradeShortAnswerItemSchema = z.object({
  questionId: z.string(),
  prompt: z.string(),
  correctAnswer: z.string(), // rubric / expected answer
  submittedAnswer: z.string(),
});
export type GradeShortAnswerItem = z.infer<typeof GradeShortAnswerItemSchema>;

export const GradeShortAnswersRequestSchema = z.object({
  items: z.array(GradeShortAnswerItemSchema).min(1),
});
export type GradeShortAnswersRequest = z.infer<typeof GradeShortAnswersRequestSchema>;

export const GradeShortAnswerResultSchema = z.object({
  questionId: z.string(),
  correct: z.boolean(),
  feedback: z.string(),
});
export type GradeShortAnswerResult = z.infer<typeof GradeShortAnswerResultSchema>;

export const GradeShortAnswersResponseSchema = z.object({
  results: z.array(GradeShortAnswerResultSchema),
});
export type GradeShortAnswersResponse = z.infer<typeof GradeShortAnswersResponseSchema>;

export const QuizAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
});
export type QuizAnswer = z.infer<typeof QuizAnswerSchema>;

/** Body of POST /attempts. Knowledge checks never create an attempt — see GenerateQuizRequestSchema. */
export const StartQuizAttemptRequestSchema = z
  .object({
    courseId: z.string(),
    moduleId: z.string().optional(),
    type: GradedQuizTypeSchema,
    userLevel: z.string().optional(),
  })
  .refine((v) => v.type !== "module_quiz" || Boolean(v.moduleId), {
    message: "moduleId is required for module_quiz",
  });
export type StartQuizAttemptRequest = z.infer<typeof StartQuizAttemptRequestSchema>;

export const SubmitQuizAttemptRequestSchema = z.object({
  answers: z.array(QuizAnswerSchema).min(1),
});
export type SubmitQuizAttemptRequest = z.infer<typeof SubmitQuizAttemptRequestSchema>;

export const QuestionFeedbackSchema = z.object({
  questionId: z.string(),
  correct: z.boolean(),
  correctAnswer: z.string(),
  feedback: z.string(),
});
export type QuestionFeedback = z.infer<typeof QuestionFeedbackSchema>;

/** Question shape returned to the client before submission — answer key withheld. */
export const PublicQuizQuestionSchema = QuizQuestionSchema.omit({ correctAnswer: true, explanation: true });
export type PublicQuizQuestion = z.infer<typeof PublicQuizQuestionSchema>;

export const QuizAttemptResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  moduleId: z.string().nullable(),
  type: GradedQuizTypeSchema,
  questions: z.array(PublicQuizQuestionSchema),
  answers: z.array(QuizAnswerSchema).nullable(),
  score: z.number().min(0).max(100).nullable(),
  passed: z.boolean().nullable(),
  feedback: z.array(QuestionFeedbackSchema).nullable(),
  retryAvailableAt: z.string().nullable(), // ISO 8601, set once this attempt is a fail
  startedAt: z.string(),
  submittedAt: z.string().nullable(),
});
export type QuizAttemptResponse = z.infer<typeof QuizAttemptResponseSchema>;

/** Body of POST /knowledge-checks/completed — ungraded, never persisted; just a progress signal. */
export const RecordKnowledgeCheckCompletionRequestSchema = z.object({
  courseId: z.string(),
  moduleId: z.string().optional(),
  lessonId: z.string(),
});
export type RecordKnowledgeCheckCompletionRequest = z.infer<typeof RecordKnowledgeCheckCompletionRequestSchema>;

/** Response of GET /internal/attempts/recent — consumed by progress-service's dashboard. */
export const RecentQuizAttemptSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  submittedAt: z.string(),
});
export type RecentQuizAttempt = z.infer<typeof RecentQuizAttemptSchema>;
