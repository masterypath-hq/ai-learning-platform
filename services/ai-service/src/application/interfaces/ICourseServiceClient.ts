import type { CourseResponse, LessonWithContextResponse, ModuleWithContextResponse } from "@ai-learning-platform/shared";

export interface ICourseServiceClient {
  getLesson(lessonId: string): Promise<LessonWithContextResponse>;
  getModule(moduleId: string): Promise<ModuleWithContextResponse>;
  getCourse(courseId: string): Promise<CourseResponse>;
}
