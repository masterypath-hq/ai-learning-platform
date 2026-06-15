import type { CourseResponse, ListTrackCoursesResponse, ListEnrolledCoursesResponse } from "@ai-learning-platform/shared";

export interface ICourseService {
  getCourse(courseId: string): Promise<CourseResponse>;
  listAllCourses(): Promise<ListTrackCoursesResponse>;
  listMyCourses(userId: string): Promise<ListEnrolledCoursesResponse>;
}
