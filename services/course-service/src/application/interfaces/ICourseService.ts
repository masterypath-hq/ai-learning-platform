import type {
  CourseResponse,
  EnrolledCourse,
  ListTrackCoursesResponse,
  ListEnrolledCoursesResponse,
  ListModulesResponse,
  ListTracksResponse,
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
  enrollCourse(courseId: string, userId: string): Promise<EnrolledCourse>;
  completeOnboarding(
    courseId: string,
    userId: string,
    selfAssessedLevel: SelfAssessmentLevel,
    questionId: string,
    answer: string,
    confidenceRatings: SkillConfidenceRating[]
  ): Promise<EnrolledCourse>;
}
