import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { IModuleRepository } from "../interfaces/IModuleRepository.js";
import type { ILessonRepository } from "../interfaces/ILessonRepository.js";
import type { IGetCourseAction } from "../interfaces/IGetCourseAction.js";
import type {
  CourseResponse,
  ModuleResponse,
  LessonResponse,
  WorkedExampleResponse,
  PracticeExerciseResponse,
} from "@ai-learning-platform/shared";

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
        const { lessons, workedExamples, practiceExercises } =
          await this.lessonRepo.findByModuleId(mod.id);

        const lessonResponses: LessonResponse[] = lessons.map((lesson) => {
          const examples: WorkedExampleResponse[] = workedExamples
            .filter((we) => we.lessonId === lesson.id)
            .map((we) => ({
              id: we.id,
              position: we.position,
              title: we.title,
              content: we.content,
              solution: we.solution,
            }));

          const exercise = practiceExercises.find((pe) => pe.lessonId === lesson.id);
          const practiceExercise: PracticeExerciseResponse | null = exercise
            ? {
                id: exercise.id,
                title: exercise.title,
                prompt: exercise.prompt,
                hints: exercise.hints,
                sampleSolution: exercise.sampleSolution,
              }
            : null;

          return {
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            contentUrl: lesson.contentUrl,
            contentType: lesson.contentType,
            durationMins: lesson.durationMins,
            orderIndex: lesson.orderIndex,
            isPublished: lesson.isPublished,
            isProject: lesson.isProject,
            workedExamples: examples,
            practiceExercise,
          };
        });

        return {
          id: mod.id,
          phase: mod.phase,
          title: mod.title,
          description: mod.description,
          orderIndex: mod.orderIndex,
          durationWeeks: mod.durationWeeks,
          isPublished: mod.isPublished,
          lessons: lessonResponses,
        };
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
      isPublished: course.isPublished,
      modules: moduleResponses,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }
}
