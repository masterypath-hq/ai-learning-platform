import type { IGetCourseAction } from "../interfaces/IGetCourseAction.js";
import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository.js";
import type { IModuleRepository } from "../interfaces/IModuleRepository.js";
import type { ILessonRepository } from "../interfaces/ILessonRepository.js";
import type { IPlacementQuestionRepository } from "../interfaces/IPlacementQuestionRepository.js";
import type { ISkillRepository } from "../interfaces/ISkillRepository.js";
import type { IUserSkillConfidenceRepository, SkillConfidenceRating } from "../interfaces/IUserSkillConfidenceRepository.js";
import type { IPlacementAnswerRepository } from "../interfaces/IPlacementAnswerRepository.js";
import type { ICourseContentWriter } from "../interfaces/ICourseContentWriter.js";
import type { ICourseGenerationWriter } from "../interfaces/ICourseGenerationWriter.js";
import type { ICourseService } from "../interfaces/ICourseService.js";
import { mapLessonToResponse, mapModuleToResponse } from "../mappers/courseResponseMappers.js";
import type {
  CompleteOnboardingResponse,
  CourseOutlineResponse,
  CourseResponse,
  EnrolledCourse,
  GenerationModuleStatus,
  GenerationStatusResponse,
  LessonWithContextResponse,
  ListTrackCoursesResponse,
  ListEnrolledCoursesResponse,
  ListModulesResponse,
  ListTracksResponse,
  ModuleWithContextResponse,
  PersistCourseContentRequest,
  PersistLesson,
  PhaseLevel,
  PlacementQuestionResponse,
  SelfAssessmentLevel,
  SkillResponse,
} from "@ai-learning-platform/shared";

const SELF_ASSESSMENT_TO_PHASE: Record<SelfAssessmentLevel, PhaseLevel> = {
  complete_beginner: "foundation",
  some_exposure: "foundation",
  intermediate: "intermediate",
  advanced: "advanced",
};

export class CourseService implements ICourseService {
  constructor(
    private readonly getCourseAction: IGetCourseAction,
    private readonly courseRepo: ICourseRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly moduleRepo: IModuleRepository,
    private readonly lessonRepo: ILessonRepository,
    private readonly placementQuestionRepo: IPlacementQuestionRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly userSkillConfidenceRepo: IUserSkillConfidenceRepository,
    private readonly placementAnswerRepo: IPlacementAnswerRepository,
    private readonly courseContentWriter: ICourseContentWriter,
    private readonly courseGenerationWriter: ICourseGenerationWriter
  ) {}

  async getCourse(courseId: string): Promise<CourseResponse> {
    return this.getCourseAction.execute(courseId);
  }

  async listAllCourses(): Promise<ListTrackCoursesResponse> {
    const courses = await this.courseRepo.findAllPublished();
    return { courses, total: courses.length };
  }

  async listMyCourses(userId: string): Promise<ListEnrolledCoursesResponse> {
    const courses = await this.enrollmentRepo.findByUserId(userId);
    return { courses, total: courses.length };
  }

  async getModulesByCourseId(courseId: string): Promise<ListModulesResponse> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    const modules = await this.moduleRepo.findByCourseId(courseId);
    return {
      course: {
        ...course.toResponse(),
        modules: modules.map((m) => ({
          id: m.id,
          phase: m.phase,
          title: m.title,
          description: m.description,
          orderIndex: m.orderIndex,
          durationWeeks: m.durationWeeks,
          isPublished: m.isPublished,
        })),
      },
      total: modules.length,
    };
  }

  async listTracks(): Promise<ListTracksResponse> {
    const tracks = await this.courseRepo.findAllGroupedByCategory();
    return { tracks };
  }

  async listSkills(courseId: string): Promise<SkillResponse[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    return this.skillRepo.findByCourseId(courseId);
  }

  async getPlacementQuestion(courseId: string, selfAssessedLevel: SelfAssessmentLevel): Promise<PlacementQuestionResponse> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    const phase = SELF_ASSESSMENT_TO_PHASE[selfAssessedLevel];
    const question = await this.placementQuestionRepo.findByCourseAndLevel(course.id, phase);
    if (!question) throw new Error("QUESTION_NOT_FOUND");
    return {
      id: question.id,
      question: question.question,
      options: question.options,
      codeSnippet: question.codeSnippet,
      codeLanguage: question.codeLanguage,
    };
  }

  async checkPlacementAnswer(questionId: string, answer: string): Promise<boolean> {
    const question = await this.placementQuestionRepo.findById(questionId);
    if (!question) throw new Error("QUESTION_NOT_FOUND");
    return answer === question.correctOption;
  }

  async enrollCourse(courseId: string, userId: string): Promise<EnrolledCourse> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    return this.enrollmentRepo.create(courseId, userId, "foundation");
  }

  async completeOnboarding(
    courseId: string,
    userId: string,
    selfAssessedLevel: SelfAssessmentLevel,
    questionId: string,
    answer: string,
    confidenceRatings: SkillConfidenceRating[],
    goal?: string | null
  ): Promise<CompleteOnboardingResponse> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");

    const question = await this.placementQuestionRepo.findById(questionId);
    if (!question) throw new Error("QUESTION_NOT_FOUND");

    const isCorrect = answer === question.correctOption;
    const phase = isCorrect ? question.phaseIfCorrect : question.phaseIfWrong;

    await this.placementAnswerRepo.record(userId, questionId, answer, isCorrect);
    if (confidenceRatings.length > 0) {
      // Upsert before creating the enrollment so its prior-experience lookup sees these ratings.
      await this.userSkillConfidenceRepo.upsertMany(userId, confidenceRatings);
    }

    const enrollment = await this.enrollmentRepo.create(course.id, userId, phase, selfAssessedLevel, goal);
    return { ...enrollment, placementCorrect: isCorrect };
  }

  async persistGeneratedContent(courseId: string, content: PersistCourseContentRequest): Promise<void> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    await this.courseContentWriter.replaceContent(courseId, content);
  }

  async getGenerationStatus(courseId: string): Promise<GenerationStatusResponse> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    const status = await this.courseGenerationWriter.getStatus(courseId);
    const response = course.toResponse();
    return {
      courseId,
      slug: response.slug,
      title: response.title,
      hasOutline: status.hasOutline,
      isFullyGenerated: status.isFullyGenerated,
      modules: status.modules,
    };
  }

  async persistGenerationOutline(courseId: string, outline: CourseOutlineResponse): Promise<GenerationModuleStatus[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    return this.courseGenerationWriter.persistOutline(courseId, outline);
  }

  async persistGenerationModuleLessons(courseId: string, moduleId: string, lessons: PersistLesson[]): Promise<void> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    await this.courseGenerationWriter.persistModuleLessons(courseId, moduleId, lessons);
  }

  async clearGeneratedContent(courseId: string): Promise<void> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    await this.courseGenerationWriter.clearGeneratedContent(courseId);
  }

  async getLessonById(lessonId: string): Promise<LessonWithContextResponse> {
    const bundle = await this.lessonRepo.findById(lessonId);
    if (!bundle) throw new Error("LESSON_NOT_FOUND");
    const mod = await this.moduleRepo.findById(bundle.lesson.moduleId);
    if (!mod) throw new Error("LESSON_NOT_FOUND");
    return {
      courseId: mod.courseId,
      moduleId: mod.id,
      lesson: mapLessonToResponse(bundle.lesson, bundle.workedExamples, bundle.practiceExercise),
    };
  }

  async getModuleById(moduleId: string): Promise<ModuleWithContextResponse> {
    const mod = await this.moduleRepo.findById(moduleId);
    if (!mod) throw new Error("MODULE_NOT_FOUND");
    const { lessons, workedExamples, practiceExercises } = await this.lessonRepo.findByModuleId(moduleId);
    const lessonResponses = lessons.map((lesson) =>
      mapLessonToResponse(
        lesson,
        workedExamples.filter((we) => we.lessonId === lesson.id),
        practiceExercises.find((pe) => pe.lessonId === lesson.id) ?? null
      )
    );
    return {
      courseId: mod.courseId,
      module: mapModuleToResponse(mod, lessonResponses),
    };
  }
}
