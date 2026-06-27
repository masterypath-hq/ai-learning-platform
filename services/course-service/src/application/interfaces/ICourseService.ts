import type { CourseResponse, EnrolledCourse, ListTrackCoursesResponse, ListEnrolledCoursesResponse, ListModulesResponse } from "@ai-learning-platform/shared";

export interface ICourseService {
  getCourse(courseId: string): Promise<CourseResponse>;
  listAllCourses(): Promise<ListTrackCoursesResponse>;
  listMyCourses(userId: string): Promise<ListEnrolledCoursesResponse>;
  getModulesByCourseId(courseId: string): Promise<ListModulesResponse>;
  enrollCourse(courseId: string, userId: string): Promise<EnrolledCourse>;
}
