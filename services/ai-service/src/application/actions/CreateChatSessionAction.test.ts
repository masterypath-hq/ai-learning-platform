import { jest } from "@jest/globals";
import { CreateChatSessionAction } from "./CreateChatSessionAction.js";
import { ChatSession } from "../../domain/models/ChatSession.js";
import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import type { CourseResponse, EnrolledCourse, LessonWithContextResponse, ModuleResponse } from "@ai-learning-platform/shared";

function makeEnrollment(overrides: Partial<EnrolledCourse> = {}): EnrolledCourse {
  return {
    enrollmentId: "enrollment-1",
    courseId: "course-1",
    slug: "cybersecurity",
    title: "Cybersecurity",
    description: null,
    primaryLanguage: null,
    thumbnailUrl: null,
    durationWeeks: 36,
    status: "active",
    currentPhase: "foundation",
    selfAssessedLevel: "advanced",
    selfAssessmentCompletedAt: new Date().toISOString(),
    goal: "become a pentester",
    priorExperienceSkillNames: ["Networking", "Linux"],
    enrolledAt: new Date().toISOString(),
    completedAt: null,
    ...overrides,
  };
}

function makeLesson(overrides: Partial<LessonWithContextResponse["lesson"]> = {}) {
  return {
    id: "lesson-1",
    slug: "lesson-1",
    title: "Reflected XSS",
    contentUrl: null,
    contentType: "markdown",
    explanationContent: "XSS happens when...",
    keyTakeaways: ["Sanitize input", "Encode output"],
    durationMins: 20,
    orderIndex: 0,
    isPublished: true,
    isProject: false,
    workedExamples: [{ id: "we-1", title: "Reflect a payload", content: "...", solution: "...", position: 0 }],
    practiceExercise: null,
    ...overrides,
  };
}

function makeModule(overrides: Partial<ModuleResponse> = {}): ModuleResponse {
  return {
    id: "module-1",
    phase: "intermediate",
    title: "XSS, IDOR, and Misconfigurations",
    description: null,
    keyConcepts: [],
    orderIndex: 3,
    durationWeeks: 2,
    isPublished: true,
    lessons: [makeLesson()],
    ...overrides,
  };
}

function makeCourse(modules: ModuleResponse[]): CourseResponse {
  return {
    id: "course-1",
    slug: "cybersecurity",
    title: "Cybersecurity",
    description: null,
    primaryLanguage: null,
    thumbnailUrl: null,
    durationWeeks: 36,
    learningObjectives: [],
    prerequisites: [],
    isPublished: true,
    modules,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeChatSessionRepo(overrides: Partial<IChatSessionRepository> = {}): IChatSessionRepository {
  return {
    create: jest.fn<IChatSessionRepository["create"]>(async (params) =>
      ChatSession.create({
        id: "session-1",
        userId: params.userId,
        subjectArea: params.subjectArea,
        track: params.track,
        topic: params.topic,
        learnerProfile: params.learnerProfile,
        lessonId: params.lessonId,
        moduleId: params.moduleId,
        courseId: params.courseId,
        lessonSnapshot: params.lessonSnapshot,
        curriculumSnapshot: params.curriculumSnapshot,
        summary: null,
        suggestedNextQuestions: [],
        createdAt: new Date(),
        closedAt: null,
      })
    ),
    findById: jest.fn<IChatSessionRepository["findById"]>(),
    findByUserId: jest.fn<IChatSessionRepository["findByUserId"]>(),
    findOpenByUserAndLesson: jest.fn<IChatSessionRepository["findOpenByUserAndLesson"]>().mockResolvedValue(null),
    close: jest.fn<IChatSessionRepository["close"]>(),
    ...overrides,
  };
}

function makeCourseServiceClient(overrides: Partial<ICourseServiceClient> = {}): ICourseServiceClient {
  const currentModule = makeModule();
  return {
    getLesson: jest
      .fn<ICourseServiceClient["getLesson"]>()
      .mockResolvedValue({ courseId: "course-1", moduleId: currentModule.id, lesson: makeLesson() }),
    getModule: jest.fn<ICourseServiceClient["getModule"]>(),
    getCourse: jest.fn<ICourseServiceClient["getCourse"]>().mockResolvedValue(makeCourse([currentModule])),
    getEnrolledCourses: jest.fn<ICourseServiceClient["getEnrolledCourses"]>().mockResolvedValue([]),
    ...overrides,
  };
}

describe("CreateChatSessionAction", () => {
  it("derives subjectArea/track/topic from the lesson and its course", async () => {
    const chatSessionRepo = makeChatSessionRepo();
    const courseServiceClient = makeCourseServiceClient();
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    const session = await action.execute("user-1", { lessonId: "lesson-1" });

    expect(session.subjectArea).toBe("programming");
    expect(session.track).toBe("cybersecurity");
    expect(session.topic).toBe("Reflected XSS");
    expect(session.lessonId).toBe("lesson-1");
  });

  it("returns the existing open session for the lesson instead of creating a duplicate", async () => {
    const existing = ChatSession.create({
      id: "session-existing",
      userId: "user-1",
      subjectArea: "programming",
      track: "cybersecurity",
      topic: "Reflected XSS",
      learnerProfile: null,
      lessonId: "lesson-1",
      moduleId: "module-1",
      courseId: "course-1",
      lessonSnapshot: { title: "Reflected XSS", explanationContent: null, keyTakeaways: [], workedExampleTitles: [] },
      curriculumSnapshot: [],
      summary: null,
      suggestedNextQuestions: [],
      createdAt: new Date(),
      closedAt: null,
    });
    const chatSessionRepo = makeChatSessionRepo({
      findOpenByUserAndLesson: jest.fn<IChatSessionRepository["findOpenByUserAndLesson"]>().mockResolvedValue(existing),
    });
    const courseServiceClient = makeCourseServiceClient();
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    const session = await action.execute("user-1", { lessonId: "lesson-1" });

    expect(session.id).toBe("session-existing");
    expect(courseServiceClient.getLesson).not.toHaveBeenCalled();
    expect(chatSessionRepo.create).not.toHaveBeenCalled();
  });

  it("derives a learnerProfile from the enrollment matching the lesson's course", async () => {
    const chatSessionRepo = makeChatSessionRepo();
    const courseServiceClient = makeCourseServiceClient({
      getEnrolledCourses: jest
        .fn<ICourseServiceClient["getEnrolledCourses"]>()
        .mockResolvedValue([makeEnrollment({ courseId: "course-1" })]),
    });
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    const session = await action.execute("user-1", { lessonId: "lesson-1" });

    expect(session.learnerProfile).toContain("advanced");
    expect(session.learnerProfile).toContain("become a pentester");
  });

  it("falls back to null learnerProfile when no enrollment matches the course", async () => {
    const chatSessionRepo = makeChatSessionRepo();
    const courseServiceClient = makeCourseServiceClient({
      getEnrolledCourses: jest
        .fn<ICourseServiceClient["getEnrolledCourses"]>()
        .mockResolvedValue([makeEnrollment({ courseId: "some-other-course" })]),
    });
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    const session = await action.execute("user-1", { lessonId: "lesson-1" });

    expect(session.learnerProfile).toBeNull();
  });

  it("degrades to null instead of throwing when the enrollment lookup fails", async () => {
    const chatSessionRepo = makeChatSessionRepo();
    const courseServiceClient = makeCourseServiceClient({
      getEnrolledCourses: jest
        .fn<ICourseServiceClient["getEnrolledCourses"]>()
        .mockRejectedValue(new Error("course-service unreachable")),
    });
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    const session = await action.execute("user-1", { lessonId: "lesson-1" });

    expect(session.learnerProfile).toBeNull();
  });

  it("builds the curriculum snapshot only from modules after the current one", async () => {
    const currentModule = makeModule({ id: "module-1", orderIndex: 1, phase: "intermediate", title: "Current" });
    const earlierModule = makeModule({ id: "module-0", orderIndex: 0, phase: "foundation", title: "Earlier" });
    const laterModule = makeModule({ id: "module-2", orderIndex: 2, phase: "advanced", title: "Later" });
    const chatSessionRepo = makeChatSessionRepo();
    const courseServiceClient = makeCourseServiceClient({
      getLesson: jest
        .fn<ICourseServiceClient["getLesson"]>()
        .mockResolvedValue({ courseId: "course-1", moduleId: "module-1", lesson: makeLesson() }),
      getCourse: jest
        .fn<ICourseServiceClient["getCourse"]>()
        .mockResolvedValue(makeCourse([earlierModule, currentModule, laterModule])),
    });
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    await action.execute("user-1", { lessonId: "lesson-1" });

    const createCall = (chatSessionRepo.create as jest.Mock).mock.calls[0][0] as { curriculumSnapshot: { title: string }[] };
    expect(createCall.curriculumSnapshot).toEqual([{ phase: "advanced", title: "Later" }]);
  });
});
