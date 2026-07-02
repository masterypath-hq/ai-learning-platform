import type { CourseResponse, EnrolledCourse, ListTrackCoursesResponse, ListEnrolledCoursesResponse, ListModulesResponse, ListTracksResponse, PhaseLevel, PlacementQuestionResponse } from "@ai-learning-platform/shared";

export interface ICourseService {
  getCourse(courseId: string): Promise<CourseResponse>;
  listAllCourses(): Promise<ListTrackCoursesResponse>;
  listMyCourses(userId: string): Promise<ListEnrolledCoursesResponse>;
  getModulesByCourseId(courseId: string): Promise<ListModulesResponse>;
  listTracks(): Promise<ListTracksResponse>;
  getPlacementQuestion(trackSlug: string, level: PhaseLevel): Promise<PlacementQuestionResponse>;
  enrollCourse(courseId: string, userId: string): Promise<EnrolledCourse>;
  chooseTrack(trackSlug: string, userId: string, questionId: string, answer: string): Promise<EnrolledCourse>;
}
