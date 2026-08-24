import { jest } from "@jest/globals";
import { GetModuleStatusAction } from "./GetModuleStatusAction.js";
import type { CourseResponse, ModuleResponse } from "@ai-learning-platform/shared";
import type { IProgressRecordRepository } from "../interfaces/IProgressRecordRepository.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";

function makeLesson(id: string, orderIndex: number) {
  return {
    id,
    slug: id,
    title: `Lesson ${id}`,
    contentUrl: null,
    contentType: "markdown",
    explanationContent: null,
    keyTakeaways: [],
    durationMins: 10,
    orderIndex,
    isPublished: true,
    isProject: false,
    workedExamples: [],
    practiceExercise: null,
  };
}

function makeModule(overrides: Partial<ModuleResponse> = {}): ModuleResponse {
  return {
    id: "m1",
    phase: "foundation",
    title: "Module 1",
    description: null,
    keyConcepts: [],
    orderIndex: 0,
    durationWeeks: 2,
    isPublished: true,
    lessons: [makeLesson("l1", 0), makeLesson("l2", 1)],
    ...overrides,
  };
}

function makeCourse(modules: ModuleResponse[]): CourseResponse {
  return {
    id: "course-1",
    slug: "backend",
    title: "Backend Engineering",
    description: null,
    primaryLanguage: null,
    thumbnailUrl: null,
    durationWeeks: 10,
    learningObjectives: [],
    prerequisites: [],
    isPublished: true,
    modules,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeProgressRecordRepo(overrides: Partial<IProgressRecordRepository> = {}): IProgressRecordRepository {
  return {
    record: jest.fn<IProgressRecordRepository["record"]>(),
    countDistinctLessonsViewed: jest.fn<IProgressRecordRepository["countDistinctLessonsViewed"]>().mockResolvedValue(0),
    findViewedLessonIds: jest.fn<IProgressRecordRepository["findViewedLessonIds"]>().mockResolvedValue([]),
    findKnowledgeCheckPassedLessonIds: jest
      .fn<IProgressRecordRepository["findKnowledgeCheckPassedLessonIds"]>()
      .mockResolvedValue([]),
    findCompletedModuleIds: jest.fn<IProgressRecordRepository["findCompletedModuleIds"]>().mockResolvedValue([]),
    hasActivityType: jest.fn<IProgressRecordRepository["hasActivityType"]>().mockResolvedValue(false),
    hasCourseActivityType: jest.fn<IProgressRecordRepository["hasCourseActivityType"]>().mockResolvedValue(false),
    findMostRecentCourseId: jest.fn<IProgressRecordRepository["findMostRecentCourseId"]>().mockResolvedValue(null),
    findRecent: jest.fn<IProgressRecordRepository["findRecent"]>().mockResolvedValue([]),
    ...overrides,
  };
}

function makeCourseServiceClient(course: CourseResponse): ICourseServiceClient {
  return {
    getEnrolledCourses: jest.fn<ICourseServiceClient["getEnrolledCourses"]>().mockResolvedValue([]),
    getCourse: jest.fn<ICourseServiceClient["getCourse"]>().mockResolvedValue(course),
  };
}

describe("GetModuleStatusAction", () => {
  it("never locks the first module, and locks lesson 2 until lesson 1's knowledge check is passed", async () => {
    const course = makeCourse([makeModule()]);
    const progressRecordRepo = makeProgressRecordRepo();
    const action = new GetModuleStatusAction(progressRecordRepo, makeCourseServiceClient(course));

    const [status] = await action.execute("user-1", "course-1");

    expect(status.locked).toBe(false);
    expect(status.lessons[0].locked).toBe(false);
    expect(status.lessons[1].locked).toBe(true);
  });

  it("unlocks lesson 2 once lesson 1's knowledge check is passed", async () => {
    const course = makeCourse([makeModule()]);
    const progressRecordRepo = makeProgressRecordRepo({
      findKnowledgeCheckPassedLessonIds: jest
        .fn<IProgressRecordRepository["findKnowledgeCheckPassedLessonIds"]>()
        .mockResolvedValue(["l1"]),
    });
    const action = new GetModuleStatusAction(progressRecordRepo, makeCourseServiceClient(course));

    const [status] = await action.execute("user-1", "course-1");

    expect(status.lessons[1].locked).toBe(false);
  });

  it("does not consider a lesson complete just because its page was opened", async () => {
    const course = makeCourse([makeModule()]);
    const progressRecordRepo = makeProgressRecordRepo({
      findViewedLessonIds: jest.fn<IProgressRecordRepository["findViewedLessonIds"]>().mockResolvedValue(["l1", "l2"]),
    });
    const action = new GetModuleStatusAction(progressRecordRepo, makeCourseServiceClient(course));

    const [status] = await action.execute("user-1", "course-1");

    expect(status.lessons[0].completed).toBe(false);
    expect(status.lessons[1].locked).toBe(true);
  });

  it("does not mark a module completed from lessons alone — the quiz must also be passed", async () => {
    const course = makeCourse([makeModule()]);
    const progressRecordRepo = makeProgressRecordRepo({
      findKnowledgeCheckPassedLessonIds: jest
        .fn<IProgressRecordRepository["findKnowledgeCheckPassedLessonIds"]>()
        .mockResolvedValue(["l1", "l2"]),
    });
    const action = new GetModuleStatusAction(progressRecordRepo, makeCourseServiceClient(course));

    const [status] = await action.execute("user-1", "course-1");

    expect(status.completed).toBe(false);
  });

  it("locks module 2 until module 1's knowledge checks are passed and its quiz is passed", async () => {
    const course = makeCourse([
      makeModule({ id: "m1", orderIndex: 0 }),
      makeModule({ id: "m2", orderIndex: 1, lessons: [makeLesson("l3", 0)] }),
    ]);
    const progressRecordRepo = makeProgressRecordRepo({
      findKnowledgeCheckPassedLessonIds: jest
        .fn<IProgressRecordRepository["findKnowledgeCheckPassedLessonIds"]>()
        .mockResolvedValue(["l1", "l2"]),
      findCompletedModuleIds: jest.fn<IProgressRecordRepository["findCompletedModuleIds"]>().mockResolvedValue([]),
    });
    const action = new GetModuleStatusAction(progressRecordRepo, makeCourseServiceClient(course));

    const [m1, m2] = await action.execute("user-1", "course-1");

    expect(m1.completed).toBe(false);
    expect(m2.locked).toBe(true);
    expect(m2.lessons[0].locked).toBe(true);
  });

  it("unlocks module 2 once module 1 is fully complete (knowledge checks passed + quiz passed)", async () => {
    const course = makeCourse([
      makeModule({ id: "m1", orderIndex: 0 }),
      makeModule({ id: "m2", orderIndex: 1, lessons: [makeLesson("l3", 0)] }),
    ]);
    const progressRecordRepo = makeProgressRecordRepo({
      findKnowledgeCheckPassedLessonIds: jest
        .fn<IProgressRecordRepository["findKnowledgeCheckPassedLessonIds"]>()
        .mockResolvedValue(["l1", "l2"]),
      findCompletedModuleIds: jest.fn<IProgressRecordRepository["findCompletedModuleIds"]>().mockResolvedValue(["m1"]),
    });
    const action = new GetModuleStatusAction(progressRecordRepo, makeCourseServiceClient(course));

    const [m1, m2] = await action.execute("user-1", "course-1");

    expect(m1.completed).toBe(true);
    expect(m2.locked).toBe(false);
    expect(m2.lessons[0].locked).toBe(false);
  });
});
