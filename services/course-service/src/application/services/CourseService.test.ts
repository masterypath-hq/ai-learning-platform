import { jest } from "@jest/globals";
import { CourseService } from "./CourseService.js";
import { Course } from "../../domain/models/Course.js";
import type { IGetCourseAction } from "../interfaces/IGetCourseAction.js";
import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository.js";
import type { IModuleRepository } from "../interfaces/IModuleRepository.js";
import type { ILessonRepository } from "../interfaces/ILessonRepository.js";
import type { IPlacementQuestionRepository, PlacementQuestion } from "../interfaces/IPlacementQuestionRepository.js";
import type { ISkillRepository } from "../interfaces/ISkillRepository.js";
import type { IUserSkillConfidenceRepository } from "../interfaces/IUserSkillConfidenceRepository.js";
import type { IPlacementAnswerRepository } from "../interfaces/IPlacementAnswerRepository.js";
import type { ICourseContentWriter } from "../interfaces/ICourseContentWriter.js";
import type { ICourseGenerationWriter } from "../interfaces/ICourseGenerationWriter.js";
import type { EnrolledCourse } from "@ai-learning-platform/shared";

function makeCourse(): Course {
  return Course.create({
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makePlacementQuestion(overrides: Partial<PlacementQuestion> = {}): PlacementQuestion {
  return {
    id: "question-1",
    question: "What is a port scan?",
    options: { a: "a", b: "b", c: "c", d: "d" },
    codeSnippet: null,
    codeLanguage: null,
    correctOption: "a",
    phaseIfCorrect: "intermediate",
    phaseIfWrong: "foundation",
    skillId: null,
    ...overrides,
  };
}

function makeEnrolledCourse(overrides: Partial<EnrolledCourse> = {}): EnrolledCourse {
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
    priorExperienceSkillNames: ["Networking"],
    enrolledAt: new Date().toISOString(),
    completedAt: null,
    ...overrides,
  };
}

describe("CourseService.completeOnboarding", () => {
  it("upserts confidence ratings before creating the enrollment, so the enrollment's prior-experience lookup can see them", async () => {
    const callOrder: string[] = [];

    const courseRepo: ICourseRepository = {
      findById: jest.fn<ICourseRepository["findById"]>().mockResolvedValue(makeCourse()),
      findBySlug: jest.fn<ICourseRepository["findBySlug"]>(),
      findAllPublished: jest.fn<ICourseRepository["findAllPublished"]>(),
      findAllGroupedByCategory: jest.fn<ICourseRepository["findAllGroupedByCategory"]>(),
    };
    const placementQuestionRepo: IPlacementQuestionRepository = {
      findByCourseAndLevel: jest.fn<IPlacementQuestionRepository["findByCourseAndLevel"]>(),
      findById: jest.fn<IPlacementQuestionRepository["findById"]>().mockResolvedValue(makePlacementQuestion()),
    };
    const placementAnswerRepo: IPlacementAnswerRepository = {
      record: jest.fn<IPlacementAnswerRepository["record"]>(async (userId, questionId, selectedOption, isCorrect) => {
        callOrder.push("record");
        return { userId, questionId, selectedOption, isCorrect, answeredAt: new Date().toISOString() };
      }),
      findByUserAndQuestion: jest.fn<IPlacementAnswerRepository["findByUserAndQuestion"]>(),
    };
    const userSkillConfidenceRepo: IUserSkillConfidenceRepository = {
      findByUserId: jest.fn<IUserSkillConfidenceRepository["findByUserId"]>(),
      upsertMany: jest.fn<IUserSkillConfidenceRepository["upsertMany"]>(async () => {
        callOrder.push("upsertMany");
        return [];
      }),
    };
    const expectedEnrollment = makeEnrolledCourse();
    const enrollmentRepo: IEnrollmentRepository = {
      findByUserId: jest.fn<IEnrollmentRepository["findByUserId"]>(),
      create: jest.fn<IEnrollmentRepository["create"]>(async () => {
        callOrder.push("create");
        return expectedEnrollment;
      }),
    };

    const service = new CourseService(
      {} as IGetCourseAction,
      courseRepo,
      enrollmentRepo,
      {} as IModuleRepository,
      {} as ILessonRepository,
      placementQuestionRepo,
      {} as ISkillRepository,
      userSkillConfidenceRepo,
      placementAnswerRepo,
      {} as ICourseContentWriter,
      {} as ICourseGenerationWriter
    );

    const result = await service.completeOnboarding(
      "course-1",
      "user-1",
      "advanced",
      "question-1",
      "a",
      [{ skillId: "skill-1", level: "confident" }],
      "become a pentester"
    );

    expect(callOrder).toEqual(["record", "upsertMany", "create"]);
    expect(enrollmentRepo.create).toHaveBeenCalledWith("course-1", "user-1", "intermediate", "advanced", "become a pentester");
    expect(result).toBe(expectedEnrollment);
  });

  it("does not call upsertMany when there are no confidence ratings", async () => {
    const courseRepo: ICourseRepository = {
      findById: jest.fn<ICourseRepository["findById"]>().mockResolvedValue(makeCourse()),
      findBySlug: jest.fn<ICourseRepository["findBySlug"]>(),
      findAllPublished: jest.fn<ICourseRepository["findAllPublished"]>(),
      findAllGroupedByCategory: jest.fn<ICourseRepository["findAllGroupedByCategory"]>(),
    };
    const placementQuestionRepo: IPlacementQuestionRepository = {
      findByCourseAndLevel: jest.fn<IPlacementQuestionRepository["findByCourseAndLevel"]>(),
      findById: jest
        .fn<IPlacementQuestionRepository["findById"]>()
        .mockResolvedValue(makePlacementQuestion({ correctOption: "b" })),
    };
    const placementAnswerRepo: IPlacementAnswerRepository = {
      record: jest
        .fn<IPlacementAnswerRepository["record"]>()
        .mockResolvedValue({ userId: "user-1", questionId: "question-1", selectedOption: "a", isCorrect: false, answeredAt: "" }),
      findByUserAndQuestion: jest.fn<IPlacementAnswerRepository["findByUserAndQuestion"]>(),
    };
    const userSkillConfidenceRepo: IUserSkillConfidenceRepository = {
      findByUserId: jest.fn<IUserSkillConfidenceRepository["findByUserId"]>(),
      upsertMany: jest.fn<IUserSkillConfidenceRepository["upsertMany"]>(),
    };
    const enrollmentRepo: IEnrollmentRepository = {
      findByUserId: jest.fn<IEnrollmentRepository["findByUserId"]>(),
      create: jest.fn<IEnrollmentRepository["create"]>().mockResolvedValue(makeEnrolledCourse()),
    };

    const service = new CourseService(
      {} as IGetCourseAction,
      courseRepo,
      enrollmentRepo,
      {} as IModuleRepository,
      {} as ILessonRepository,
      placementQuestionRepo,
      {} as ISkillRepository,
      userSkillConfidenceRepo,
      placementAnswerRepo,
      {} as ICourseContentWriter,
      {} as ICourseGenerationWriter
    );

    await service.completeOnboarding("course-1", "user-1", "advanced", "question-1", "a", []);

    expect(userSkillConfidenceRepo.upsertMany).not.toHaveBeenCalled();
    expect(enrollmentRepo.create).toHaveBeenCalledWith("course-1", "user-1", "foundation", "advanced", undefined);
  });
});
