import type { LessonStatusItem, ModuleStatusResponse } from "@ai-learning-platform/shared";
import type { IProgressRecordRepository } from "../interfaces/IProgressRecordRepository.js";
import type { ICourseServiceClient } from "../interfaces/ICourseServiceClient.js";
import type { IGetModuleStatusAction } from "../interfaces/IGetModuleStatusAction.js";

export class GetModuleStatusAction implements IGetModuleStatusAction {
  constructor(
    private readonly progressRecordRepo: IProgressRecordRepository,
    private readonly courseServiceClient: ICourseServiceClient
  ) {}

  async execute(userId: string, courseId: string): Promise<ModuleStatusResponse[]> {
    const course = await this.courseServiceClient.getCourse(courseId);
    const [passedLessonIds, completedModuleIds] = await Promise.all([
      this.progressRecordRepo.findKnowledgeCheckPassedLessonIds(userId, courseId),
      this.progressRecordRepo.findCompletedModuleIds(userId, courseId),
    ]);
    // A lesson counts as complete once its knowledge check is passed — not merely opened.
    const passed = new Set(passedLessonIds);
    const quizPassedModules = new Set(completedModuleIds);

    // Modules are persisted in phase order already (see PersistOutlineRequestSchema), so a
    // single orderIndex sort is enough to walk foundation → mastery sequentially.
    const modules = [...course.modules].sort((a, b) => a.orderIndex - b.orderIndex);

    const result: ModuleStatusResponse[] = [];
    let previousModuleCompleted = true;
    for (const mod of modules) {
      const lessons = [...mod.lessons].sort((a, b) => a.orderIndex - b.orderIndex);
      const moduleLocked = !previousModuleCompleted;

      let previousLessonCompleted = true;
      const lessonItems: LessonStatusItem[] = lessons.map((lesson) => {
        const lessonCompleted = passed.has(lesson.id);
        const lessonLocked = moduleLocked || !previousLessonCompleted;
        previousLessonCompleted = lessonCompleted;
        return {
          id: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          completed: lessonCompleted,
          locked: lessonLocked,
        };
      });

      const allLessonsCompleted = lessons.length > 0 && lessons.every((l) => passed.has(l.id));
      const quizPassed = quizPassedModules.has(mod.id);
      const completed = allLessonsCompleted && quizPassed;

      result.push({
        moduleId: mod.id,
        phase: mod.phase,
        title: mod.title,
        orderIndex: mod.orderIndex,
        lessons: lessonItems,
        quizPassed,
        completed,
        locked: moduleLocked,
      });

      previousModuleCompleted = completed;
    }

    return result;
  }
}
