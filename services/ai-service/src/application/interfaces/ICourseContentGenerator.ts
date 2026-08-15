import type { CourseOutlineResponse, GeneratedModuleOutline, ModuleLessonsResponse } from "@ai-learning-platform/shared";

export interface ICourseContentGenerator {
  generateCourseOutline(trackSlug: string, title: string, description: string): Promise<CourseOutlineResponse>;
  generateModuleLessons(trackSlug: string, module: GeneratedModuleOutline): Promise<ModuleLessonsResponse>;
}
