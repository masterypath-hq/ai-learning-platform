import { jest } from "@jest/globals";
import { GetDashboardAction } from "./GetDashboardAction.js";
import type { EnrolledCourse, CourseResponse } from "@ai-learning-platform/shared";
import type { IProgressRecordRepository } from "../interfaces/IProgressRecordRepository.js";
import type { IStreakRepository } from "../interfaces/IStreakRepository.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import type { IAssessmentServiceClient } from "../interfaces/IAssessmentServiceClient.js";

function makeEnrolledCourse(overrides: Partial<EnrolledCourse> = {}): EnrolledCourse {
  return {
    enrollmentId: "enr-1",
    courseId: "course-android",
    slug: "mobile-android",
    title: "Mobile Engineering — Android",
    description: null,
    primaryLanguage: "Kotlin",
    thumbnailUrl: null,
    durationWeeks: 36,
    status: "active",
    currentPhase: "mastery",
    selfAssessedLevel: null,
    selfAssessmentCompletedAt: null,
    goal: null,
    priorExperienceSkillNames: [],
    enrolledAt: new Date().toISOString(),
    completedAt: null,
    ...overrides,
  };
}

function makeCourse(overrides: Partial<CourseResponse> = {}): CourseResponse {
  return {
    id: "course-android",
    slug: "mobile-android",
    title: "Mobile Engineering — Android",
    description: null,
    primaryLanguage: "Kotlin",
    thumbnailUrl: null,
    durationWeeks: 36,
    learningObjectives: [],
    prerequisites: [],
    isPublished: true,
    modules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeProgressRecordRepo(overrides: Partial<IProgressRecordRepository> = {}): IProgressRecordRepository {
  return {
    record: jest.fn<IProgressRecordRepository["record"]>(),
    countDistinctLessonsViewed: jest.fn<IProgressRecordRepository["countDistinctLessonsViewed"]>().mockResolvedValue(0),
    findViewedLessonIds: jest.fn<IProgressRecordRepository["findViewedLessonIds"]>().mockResolvedValue([]),
    hasActivityType: jest.fn<IProgressRecordRepository["hasActivityType"]>().mockResolvedValue(false),
    hasCourseActivityType: jest.fn<IProgressRecordRepository["hasCourseActivityType"]>().mockResolvedValue(false),
    findMostRecentCourseId: jest.fn<IProgressRecordRepository["findMostRecentCourseId"]>().mockResolvedValue(null),
    findRecent: jest.fn<IProgressRecordRepository["findRecent"]>().mockResolvedValue([]),
    ...overrides,
  };
}

function makeStreakRepo(): IStreakRepository {
  return {
    find: jest.fn<IStreakRepository["find"]>().mockResolvedValue(null),
    upsert: jest.fn<IStreakRepository["upsert"]>(),
  };
}

function makeCourseServiceClient(overrides: Partial<ICourseServiceClient> = {}): ICourseServiceClient {
  return {
    getEnrolledCourses: jest.fn<ICourseServiceClient["getEnrolledCourses"]>().mockResolvedValue([]),
    getCourse: jest.fn<ICourseServiceClient["getCourse"]>().mockResolvedValue(makeCourse()),
    ...overrides,
  };
}

function makeAssessmentServiceClient(): IAssessmentServiceClient {
  return {
    getRecentAttempts: jest.fn<IAssessmentServiceClient["getRecentAttempts"]>().mockResolvedValue([]),
  };
}

describe("GetDashboardAction — second-platform accelerator", () => {
  it("recommends the other mobile platform once the first is completed and the other isn't enrolled", async () => {
    const enrolled = [makeEnrolledCourse({ slug: "mobile-android", courseId: "course-android" })];
    const progressRecordRepo = makeProgressRecordRepo({
      hasCourseActivityType: jest
        .fn<IProgressRecordRepository["hasCourseActivityType"]>()
        .mockImplementation(async (_userId, courseId, activityType) => courseId === "course-android" && activityType === "course_completed"),
    });
    const action = new GetDashboardAction(
      progressRecordRepo,
      makeStreakRepo(),
      makeCourseServiceClient({ getEnrolledCourses: jest.fn<ICourseServiceClient["getEnrolledCourses"]>().mockResolvedValue(enrolled) }),
      makeAssessmentServiceClient()
    );

    const result = await action.execute("user-1");

    expect(result.recommendedNextAction).toEqual({
      type: "accelerator",
      targetTrackSlug: "mobile-ios",
      label: "Master the other platform — accelerated path",
    });
  });

  it("does not recommend the accelerator when the other platform is already enrolled", async () => {
    const enrolled = [
      makeEnrolledCourse({ slug: "mobile-android", courseId: "course-android" }),
      makeEnrolledCourse({ slug: "mobile-ios", courseId: "course-ios", enrollmentId: "enr-2" }),
    ];
    const progressRecordRepo = makeProgressRecordRepo({
      hasCourseActivityType: jest.fn<IProgressRecordRepository["hasCourseActivityType"]>().mockResolvedValue(true),
    });
    const action = new GetDashboardAction(
      progressRecordRepo,
      makeStreakRepo(),
      makeCourseServiceClient({ getEnrolledCourses: jest.fn<ICourseServiceClient["getEnrolledCourses"]>().mockResolvedValue(enrolled) }),
      makeAssessmentServiceClient()
    );

    const result = await action.execute("user-1");

    expect(result.recommendedNextAction?.type).not.toBe("accelerator");
  });

  it("does not recommend the accelerator when the first mobile track isn't completed yet", async () => {
    const enrolled = [makeEnrolledCourse({ slug: "mobile-android", courseId: "course-android" })];
    const progressRecordRepo = makeProgressRecordRepo();

    const action = new GetDashboardAction(
      progressRecordRepo,
      makeStreakRepo(),
      makeCourseServiceClient({ getEnrolledCourses: jest.fn<ICourseServiceClient["getEnrolledCourses"]>().mockResolvedValue(enrolled) }),
      makeAssessmentServiceClient()
    );

    const result = await action.execute("user-1");

    expect(result.recommendedNextAction).toBeNull();
  });

  it("falls back to the continue recommendation for non-grouped tracks", async () => {
    const enrolled = [makeEnrolledCourse({ slug: "backend", courseId: "course-backend" })];
    const progressRecordRepo = makeProgressRecordRepo({
      findMostRecentCourseId: jest.fn<IProgressRecordRepository["findMostRecentCourseId"]>().mockResolvedValue("course-backend"),
    });
    const course = makeCourse({
      id: "course-backend",
      slug: "backend",
      modules: [
        {
          id: "m1",
          phase: "foundation",
          title: "Module 1",
          description: null,
          keyConcepts: [],
          orderIndex: 0,
          durationWeeks: 2,
          isPublished: true,
          lessons: [
            {
              id: "l1",
              slug: "l1",
              title: "Lesson 1",
              contentUrl: null,
              contentType: "markdown",
              explanationContent: null,
              keyTakeaways: [],
              durationMins: 10,
              orderIndex: 0,
              isPublished: true,
              isProject: false,
              workedExamples: [],
              practiceExercise: null,
            },
          ],
        },
      ],
    });
    const action = new GetDashboardAction(
      progressRecordRepo,
      makeStreakRepo(),
      makeCourseServiceClient({
        getEnrolledCourses: jest.fn<ICourseServiceClient["getEnrolledCourses"]>().mockResolvedValue(enrolled),
        getCourse: jest.fn<ICourseServiceClient["getCourse"]>().mockResolvedValue(course),
      }),
      makeAssessmentServiceClient()
    );

    const result = await action.execute("user-1");

    expect(result.recommendedNextAction).toEqual({ type: "continue", courseId: "course-backend", lessonId: "l1", label: "Continue: Lesson 1" });
  });
});
