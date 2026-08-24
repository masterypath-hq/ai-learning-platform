import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { IModuleRepository } from "../interfaces/IModuleRepository.js";
import type { ILessonRepository } from "../interfaces/ILessonRepository.js";
import type { IGetCourseAction } from "../interfaces/IGetCourseAction.js";
import { mapLessonToResponse, mapModuleToResponse } from "../mappers/courseResponseMappers.js";
import type { CourseResponse, ModuleResponse } from "@ai-learning-platform/shared";

export class GetCourseAction implements IGetCourseAction {
  constructor(
    private readonly courseRepo: ICourseRepository,
    private readonly moduleRepo: IModuleRepository,
    private readonly lessonRepo: ILessonRepository
  ) {}

  async execute(courseId: string): Promise<CourseResponse> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");

    const modules = await this.moduleRepo.findByCourseId(courseId);

    const moduleResponses: ModuleResponse[] = await Promise.all(
      modules.map(async (mod) => {
        const { lessons, workedExamples, practiceExercises } = await this.lessonRepo.findByModuleId(mod.id);

        const lessonResponses = lessons.map((lesson) =>
          mapLessonToResponse(
            lesson,
            workedExamples.filter((we) => we.lessonId === lesson.id),
            practiceExercises.find((pe) => pe.lessonId === lesson.id) ?? null
          )
        );

        return mapModuleToResponse(mod, lessonResponses);
      })
    );

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      primaryLanguage: course.primaryLanguage,
      thumbnailUrl: course.thumbnailUrl,
      durationWeeks: course.durationWeeks,
      learningObjectives: course.learningObjectives,
      prerequisites: course.prerequisites,
      isPublished: course.isPublished,
      modules: moduleResponses,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }
}
