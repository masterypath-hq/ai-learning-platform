import { jest } from "@jest/globals";
import { CreateChatSessionAction } from "./CreateChatSessionAction.js";
import { ChatSession } from "../../domain/models/ChatSession.js";
import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import type { EnrolledCourse } from "@ai-learning-platform/shared";

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
        summary: null,
        suggestedNextQuestions: [],
        createdAt: new Date(),
        closedAt: null,
      })
    ),
    findById: jest.fn<IChatSessionRepository["findById"]>(),
    findByUserId: jest.fn<IChatSessionRepository["findByUserId"]>(),
    close: jest.fn<IChatSessionRepository["close"]>(),
    ...overrides,
  };
}

function makeCourseServiceClient(overrides: Partial<ICourseServiceClient> = {}): ICourseServiceClient {
  return {
    getLesson: jest.fn<ICourseServiceClient["getLesson"]>(),
    getModule: jest.fn<ICourseServiceClient["getModule"]>(),
    getCourse: jest.fn<ICourseServiceClient["getCourse"]>(),
    getEnrolledCourses: jest.fn<ICourseServiceClient["getEnrolledCourses"]>().mockResolvedValue([]),
    ...overrides,
  };
}

describe("CreateChatSessionAction", () => {
  it("uses the client-supplied learnerProfile as-is when provided, without looking up enrollments", async () => {
    const chatSessionRepo = makeChatSessionRepo();
    const courseServiceClient = makeCourseServiceClient();
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    const session = await action.execute("user-1", {
      subjectArea: "programming",
      track: "mobile-ios",
      learnerProfile: "experienced mobile developer, new to Kotlin",
    });

    expect(session.learnerProfile).toBe("experienced mobile developer, new to Kotlin");
    expect(courseServiceClient.getEnrolledCourses).not.toHaveBeenCalled();
  });

  it("derives a learnerProfile from the matching enrollment when none is supplied", async () => {
    const chatSessionRepo = makeChatSessionRepo();
    const courseServiceClient = makeCourseServiceClient({
      getEnrolledCourses: jest
        .fn<ICourseServiceClient["getEnrolledCourses"]>()
        .mockResolvedValue([makeEnrollment({ slug: "cybersecurity" })]),
    });
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    const session = await action.execute("user-1", { subjectArea: "programming", track: "cybersecurity" });

    expect(session.learnerProfile).toContain("advanced");
    expect(session.learnerProfile).toContain("become a pentester");
    expect(session.learnerProfile).toContain("Networking, Linux");
  });

  it("falls back to null when no enrollment matches the track", async () => {
    const chatSessionRepo = makeChatSessionRepo();
    const courseServiceClient = makeCourseServiceClient({
      getEnrolledCourses: jest
        .fn<ICourseServiceClient["getEnrolledCourses"]>()
        .mockResolvedValue([makeEnrollment({ slug: "backend" })]),
    });
    const action = new CreateChatSessionAction(chatSessionRepo, courseServiceClient);

    const session = await action.execute("user-1", { subjectArea: "programming", track: "cybersecurity" });

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

    const session = await action.execute("user-1", { subjectArea: "programming", track: "cybersecurity" });

    expect(session.learnerProfile).toBeNull();
  });
});
