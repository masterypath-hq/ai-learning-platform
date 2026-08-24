import { jest } from "@jest/globals";
import { StartQuizAttemptAction } from "./StartQuizAttemptAction.js";
import { QuizAttempt } from "../../domain/models/QuizAttempt.js";
import { CooldownActiveError } from "../errors/CooldownActiveError.js";
import type { IQuizAttemptRepository } from "../interfaces/IQuizAttemptRepository.js";
import type { IQuizServiceClient } from "../interfaces/IQuizServiceClient.js";

function makeAttempt(overrides: Partial<Parameters<typeof QuizAttempt.create>[0]> = {}): QuizAttempt {
  return QuizAttempt.create({
    id: "attempt-1",
    userId: "user-1",
    courseId: "course-1",
    moduleId: "module-1",
    type: "module_quiz",
    scopeId: "module-1",
    status: "in_progress",
    questions: [],
    answers: null,
    score: null,
    passed: null,
    feedback: null,
    startedAt: new Date(),
    submittedAt: null,
    ...overrides,
  });
}

function makeAttemptRepo(overrides: Partial<IQuizAttemptRepository> = {}): IQuizAttemptRepository {
  return {
    create: jest.fn<IQuizAttemptRepository["create"]>(),
    findById: jest.fn<IQuizAttemptRepository["findById"]>(),
    findInProgress: jest.fn<IQuizAttemptRepository["findInProgress"]>().mockResolvedValue(null),
    findLatestFailed: jest.fn<IQuizAttemptRepository["findLatestFailed"]>().mockResolvedValue(null),
    submit: jest.fn<IQuizAttemptRepository["submit"]>(),
    findByCourseId: jest.fn<IQuizAttemptRepository["findByCourseId"]>(),
    findRecentByUserId: jest.fn<IQuizAttemptRepository["findRecentByUserId"]>(),
    ...overrides,
  };
}

function makeQuizServiceClient(overrides: Partial<IQuizServiceClient> = {}): IQuizServiceClient {
  return {
    generate: jest.fn<IQuizServiceClient["generate"]>().mockResolvedValue({ questions: [] }),
    gradeShortAnswers: jest.fn<IQuizServiceClient["gradeShortAnswers"]>(),
    ...overrides,
  };
}

describe("StartQuizAttemptAction", () => {
  it("rejects with CooldownActiveError while the 24h module_quiz cool-down is still active", async () => {
    const submittedAt = new Date(Date.now() - 1 * 60 * 60 * 1000); // failed 1h ago
    const attemptRepo = makeAttemptRepo({
      findLatestFailed: jest
        .fn<IQuizAttemptRepository["findLatestFailed"]>()
        .mockResolvedValue(makeAttempt({ status: "submitted", passed: false, submittedAt })),
    });
    const quizServiceClient = makeQuizServiceClient();
    const action = new StartQuizAttemptAction(attemptRepo, quizServiceClient);

    await expect(
      action.execute("user-1", { courseId: "course-1", moduleId: "module-1", type: "module_quiz" })
    ).rejects.toBeInstanceOf(CooldownActiveError);
    expect(quizServiceClient.generate).not.toHaveBeenCalled();
  });

  it("allows a new attempt once the module_quiz cool-down has elapsed", async () => {
    const submittedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // failed 25h ago
    const newAttempt = makeAttempt();
    const attemptRepo = makeAttemptRepo({
      findLatestFailed: jest
        .fn<IQuizAttemptRepository["findLatestFailed"]>()
        .mockResolvedValue(makeAttempt({ status: "submitted", passed: false, submittedAt })),
      create: jest.fn<IQuizAttemptRepository["create"]>().mockResolvedValue(newAttempt),
    });
    const quizServiceClient = makeQuizServiceClient();
    const action = new StartQuizAttemptAction(attemptRepo, quizServiceClient);

    const result = await action.execute("user-1", { courseId: "course-1", moduleId: "module-1", type: "module_quiz" });

    expect(result).toBe(newAttempt);
    expect(quizServiceClient.generate).toHaveBeenCalledTimes(1);
  });

  it("returns the existing in-progress attempt instead of generating a new one", async () => {
    const existing = makeAttempt({ id: "existing-attempt" });
    const attemptRepo = makeAttemptRepo({
      findInProgress: jest.fn<IQuizAttemptRepository["findInProgress"]>().mockResolvedValue(existing),
    });
    const quizServiceClient = makeQuizServiceClient();
    const action = new StartQuizAttemptAction(attemptRepo, quizServiceClient);

    const result = await action.execute("user-1", { courseId: "course-1", moduleId: "module-1", type: "module_quiz" });

    expect(result).toBe(existing);
    expect(quizServiceClient.generate).not.toHaveBeenCalled();
    expect(attemptRepo.create).not.toHaveBeenCalled();
  });

  it("scopes course_final attempts by courseId, not moduleId", async () => {
    const attemptRepo = makeAttemptRepo();
    const quizServiceClient = makeQuizServiceClient();
    const action = new StartQuizAttemptAction(attemptRepo, quizServiceClient);

    await action.execute("user-1", { courseId: "course-1", type: "course_final" });

    expect(attemptRepo.findInProgress).toHaveBeenCalledWith("user-1", "course_final", "course-1");
    expect(quizServiceClient.generate).toHaveBeenCalledWith(
      expect.objectContaining({ type: "course_final", courseId: "course-1" })
    );
  });
});
