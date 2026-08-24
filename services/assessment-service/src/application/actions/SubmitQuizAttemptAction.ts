import type { GradeShortAnswerItem, QuestionFeedback, QuizAnswer, QuizQuestion } from "@ai-learning-platform/shared";
import type { QuizAttempt } from "../../domain/models/QuizAttempt.js";
import type { IQuizAttemptRepository } from "../interfaces/IQuizAttemptRepository.js";
import type { IQuizServiceClient } from "../interfaces/IQuizServiceClient.js";
import type { IProgressEventPublisher } from "../interfaces/IProgressEventPublisher.js";
import type { ISubmitQuizAttemptAction } from "../interfaces/ISubmitQuizAttemptAction.js";

const PASS_THRESHOLD = 70;

export class SubmitQuizAttemptAction implements ISubmitQuizAttemptAction {
  constructor(
    private readonly attemptRepo: IQuizAttemptRepository,
    private readonly quizServiceClient: IQuizServiceClient,
    private readonly progressEventPublisher: IProgressEventPublisher
  ) {}

  async execute(userId: string, attemptId: string, answers: QuizAnswer[]): Promise<QuizAttempt> {
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
    if (attempt.userId !== userId) throw new Error("ATTEMPT_FORBIDDEN");
    if (attempt.status !== "in_progress") throw new Error("ATTEMPT_ALREADY_SUBMITTED");

    const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a.answer]));

    const mcqFeedback: QuestionFeedback[] = [];
    const shortAnswerItems: GradeShortAnswerItem[] = [];
    const shortAnswerQuestions = new Map<string, QuizQuestion>();

    for (const q of attempt.questions) {
      const submitted = answerByQuestionId.get(q.id) ?? "";
      if (q.type === "mcq") {
        mcqFeedback.push({
          questionId: q.id,
          correct: submitted.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase(),
          correctAnswer: q.correctAnswer,
          feedback: q.explanation,
        });
      } else {
        shortAnswerItems.push({ questionId: q.id, prompt: q.prompt, correctAnswer: q.correctAnswer, submittedAnswer: submitted });
        shortAnswerQuestions.set(q.id, q);
      }
    }

    let shortAnswerFeedback: QuestionFeedback[] = [];
    if (shortAnswerItems.length > 0) {
      const graded = await this.quizServiceClient.gradeShortAnswers({ items: shortAnswerItems });
      shortAnswerFeedback = graded.results.map((r) => ({
        questionId: r.questionId,
        correct: r.correct,
        correctAnswer: shortAnswerQuestions.get(r.questionId)?.correctAnswer ?? "",
        feedback: r.feedback,
      }));
    }

    const feedback = [...mcqFeedback, ...shortAnswerFeedback];
    const correctCount = feedback.filter((f) => f.correct).length;
    const score = feedback.length > 0 ? Math.round((correctCount / feedback.length) * 100) : 0;
    const passed = score >= PASS_THRESHOLD;

    const submitted = await this.attemptRepo.submit(attemptId, { answers, score, passed, feedback });

    if (submitted.type === "module_quiz" && passed && submitted.moduleId) {
      await this.progressEventPublisher.publish({
        userId,
        courseId: submitted.courseId,
        moduleId: submitted.moduleId,
        lessonId: null,
        activityType: "module_completed",
        occurredAt: new Date().toISOString(),
      });
    }

    if (submitted.type === "course_final" && passed) {
      await this.progressEventPublisher.publish({
        userId,
        courseId: submitted.courseId,
        moduleId: null,
        lessonId: null,
        activityType: "course_completed",
        occurredAt: new Date().toISOString(),
      });
    }

    return submitted;
  }
}
