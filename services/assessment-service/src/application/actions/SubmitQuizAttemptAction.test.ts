import { jest } from "@jest/globals";
import { SubmitQuizAttemptAction } from "./SubmitQuizAttemptAction.js";
import { QuizAttempt } from "../../domain/models/QuizAttempt.js";
import type { QuizQuestion } from "@ai-learning-platform/shared";
import type { IQuizAttemptRepository, SubmitQuizAttemptParams } from "../interfaces/IQuizAttemptRepository.js";
import type { IQuizServiceClient } from "../interfaces/IQuizServiceClient.js";
import type { IProgressEventPublisher } from "../interfaces/IProgressEventPublisher.js";

const MCQ_QUESTIONS: QuizQuestion[] = [
  { id: "q1", type: "mcq", prompt: "2+2?", options: ["3", "4"], correctAnswer: "4", explanation: "Basic arithmetic." },
  { id: "q2", type: "mcq", prompt: "Capital of France?", options: ["Paris", "Rome"], correctAnswer: "Paris", explanation: "Geography." },
];

function makeAttempt(overrides: Partial<Parameters<typeof QuizAttempt.create>[0]> = {}): QuizAttempt {
  return QuizAttempt.create({
    id: "attempt-1",
    userId: "user-1",
    courseId: "course-1",
    moduleId: "module-1",
    type: "module_quiz",
    scopeId: "module-1",
    status: "in_progress",
    questions: MCQ_QUESTIONS,
    answers: null,
    score: null,
    passed: null,
    feedback: null,
    startedAt: new Date(),
    submittedAt: null,
    ...overrides,
  });
}

/** `attempt` stands in for the row already in the DB — submit() only patches the grading fields. */
function makeAttemptRepo(attempt: QuizAttempt, overrides: Partial<IQuizAttemptRepository> = {}): IQuizAttemptRepository {
  return {
    create: jest.fn<IQuizAttemptRepository["create"]>(),
    findById: jest.fn<IQuizAttemptRepository["findById"]>().mockResolvedValue(attempt),
    findInProgress: jest.fn<IQuizAttemptRepository["findInProgress"]>(),
    findLatestFailed: jest.fn<IQuizAttemptRepository["findLatestFailed"]>(),
    submit: jest.fn<IQuizAttemptRepository["submit"]>(
      async (_id: string, params: SubmitQuizAttemptParams) =>
        makeAttempt({
          id: attempt.id,
          userId: attempt.userId,
          courseId: attempt.courseId,
          moduleId: attempt.moduleId,
          type: attempt.type,
          scopeId: attempt.scopeId,
          status: "submitted",
          questions: attempt.questions,
          answers: params.answers,
          score: params.score,
          passed: params.passed,
          feedback: params.feedback,
          submittedAt: new Date(),
        })
    ),
    findByCourseId: jest.fn<IQuizAttemptRepository["findByCourseId"]>(),
    findRecentByUserId: jest.fn<IQuizAttemptRepository["findRecentByUserId"]>(),
    ...overrides,
  };
}

function makeQuizServiceClient(overrides: Partial<IQuizServiceClient> = {}): IQuizServiceClient {
  return {
    generate: jest.fn<IQuizServiceClient["generate"]>(),
    gradeShortAnswers: jest.fn<IQuizServiceClient["gradeShortAnswers"]>().mockResolvedValue({ results: [] }),
    ...overrides,
  };
}

function makePublisher(overrides: Partial<IProgressEventPublisher> = {}): IProgressEventPublisher {
  return {
    publish: jest.fn<IProgressEventPublisher["publish"]>(),
    ...overrides,
  };
}

describe("SubmitQuizAttemptAction", () => {
  it("rejects submission from a user who doesn't own the attempt", async () => {
    const attemptRepo = makeAttemptRepo(makeAttempt({ userId: "someone-else" }));
    const action = new SubmitQuizAttemptAction(attemptRepo, makeQuizServiceClient(), makePublisher());

    await expect(action.execute("user-1", "attempt-1", [])).rejects.toThrow("ATTEMPT_FORBIDDEN");
  });

  it("rejects resubmitting an already-submitted attempt", async () => {
    const attemptRepo = makeAttemptRepo(makeAttempt({ status: "submitted" }));
    const action = new SubmitQuizAttemptAction(attemptRepo, makeQuizServiceClient(), makePublisher());

    await expect(action.execute("user-1", "attempt-1", [])).rejects.toThrow("ATTEMPT_ALREADY_SUBMITTED");
  });

  it("grades MCQs locally and passes at the 70% threshold, publishing module_completed", async () => {
    const attemptRepo = makeAttemptRepo(makeAttempt());
    const publisher = makePublisher();
    const action = new SubmitQuizAttemptAction(attemptRepo, makeQuizServiceClient(), publisher);

    const result = await action.execute("user-1", "attempt-1", [
      { questionId: "q1", answer: "4" },
      { questionId: "q2", answer: "paris" }, // case-insensitive match
    ]);

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "module_completed", courseId: "course-1", moduleId: "module-1" })
    );
  });

  it("fails below 70% and does not publish module_completed", async () => {
    const attemptRepo = makeAttemptRepo(makeAttempt());
    const publisher = makePublisher();
    const action = new SubmitQuizAttemptAction(attemptRepo, makeQuizServiceClient(), publisher);

    const result = await action.execute("user-1", "attempt-1", [
      { questionId: "q1", answer: "3" }, // wrong
      { questionId: "q2", answer: "Paris" }, // right
    ]);

    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it("routes short_answer questions through the AI grading call and never publishes on a course_final pass", async () => {
    const shortAnswerQuestion: QuizQuestion = {
      id: "q3",
      type: "short_answer",
      prompt: "Explain closures.",
      correctAnswer: "must mention lexical scope",
      explanation: "Closures capture their lexical scope.",
    };
    const attemptRepo = makeAttemptRepo(makeAttempt({ type: "course_final", moduleId: null, questions: [shortAnswerQuestion] }));
    const quizServiceClient = makeQuizServiceClient({
      gradeShortAnswers: jest
        .fn<IQuizServiceClient["gradeShortAnswers"]>()
        .mockResolvedValue({ results: [{ questionId: "q3", correct: true, feedback: "Good." }] }),
    });
    const publisher = makePublisher();
    const action = new SubmitQuizAttemptAction(attemptRepo, quizServiceClient, publisher);

    const result = await action.execute("user-1", "attempt-1", [{ questionId: "q3", answer: "it captures lexical scope" }]);

    expect(quizServiceClient.gradeShortAnswers).toHaveBeenCalledWith({
      items: [{ questionId: "q3", prompt: "Explain closures.", correctAnswer: "must mention lexical scope", submittedAnswer: "it captures lexical scope" }],
    });
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    // course_final is not a module completion, even when it passes
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
