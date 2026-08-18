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
  PlacementQuestionResponse,
  SelfAssessmentLevel,
  SkillResponse,
} from "@ai-learning-platform/shared";
import type { SkillConfidenceRating } from "./IUserSkillConfidenceRepository.js";

export interface ICourseService {
  getCourse(courseId: string): Promise<CourseResponse>;
  listAllCourses(): Promise<ListTrackCoursesResponse>;
  listMyCourses(userId: string): Promise<ListEnrolledCoursesResponse>;
  getModulesByCourseId(courseId: string): Promise<ListModulesResponse>;
  listTracks(): Promise<ListTracksResponse>;
  listSkills(courseId: string): Promise<SkillResponse[]>;
  getPlacementQuestion(courseId: string, selfAssessedLevel: SelfAssessmentLevel): Promise<PlacementQuestionResponse>;
  checkPlacementAnswer(questionId: string, answer: string): Promise<boolean>;
  enrollCourse(courseId: string, userId: string): Promise<EnrolledCourse>;
  completeOnboarding(
    courseId: string,
    userId: string,
    selfAssessedLevel: SelfAssessmentLevel,
    questionId: string,
    answer: string,
    confidenceRatings: SkillConfidenceRating[],
    goal?: string | null
  ): Promise<CompleteOnboardingResponse>;
  persistGeneratedContent(courseId: string, content: PersistCourseContentRequest): Promise<void>;
  getLessonById(lessonId: string): Promise<LessonWithContextResponse>;
  getModuleById(moduleId: string): Promise<ModuleWithContextResponse>;

  getGenerationStatus(courseId: string): Promise<GenerationStatusResponse>;
  persistGenerationOutline(courseId: string, outline: CourseOutlineResponse): Promise<GenerationModuleStatus[]>;
  persistGenerationModuleLessons(courseId: string, moduleId: string, lessons: PersistLesson[]): Promise<void>;
  clearGeneratedContent(courseId: string): Promise<void>;
}
