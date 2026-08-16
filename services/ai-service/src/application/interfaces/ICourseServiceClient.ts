import type {
  CourseResponse,
  EnrolledCourse,
  LessonWithContextResponse,
  ModuleWithContextResponse,
} from "@ai-learning-platform/shared";

export interface ICourseServiceClient {
  getLesson(lessonId: string): Promise<LessonWithContextResponse>;
  getModule(moduleId: string): Promise<ModuleWithContextResponse>;
  getCourse(courseId: string): Promise<CourseResponse>;
  getEnrolledCourses(userId: string): Promise<EnrolledCourse[]>;
}
