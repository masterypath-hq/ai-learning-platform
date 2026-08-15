import type { ILessonRepository } from "../interfaces/ILessonRepository.js";
import type { IModuleRepository } from "../interfaces/IModuleRepository.js";
import type { IProgressEventPublisher } from "../interfaces/IProgressEventPublisher.js";
import type { IMarkLessonViewedAction } from "../interfaces/IMarkLessonViewedAction.js";

export class MarkLessonViewedAction implements IMarkLessonViewedAction {
  constructor(
    private readonly lessonRepo: ILessonRepository,
    private readonly moduleRepo: IModuleRepository,
    private readonly progressEventPublisher: IProgressEventPublisher
  ) {}

  async execute(userId: string, courseId: string, lessonId: string): Promise<void> {
    const bundle = await this.lessonRepo.findById(lessonId);
    if (!bundle) throw new Error("LESSON_NOT_FOUND");

    const mod = await this.moduleRepo.findById(bundle.lesson.moduleId);
    if (!mod || mod.courseId !== courseId) throw new Error("LESSON_NOT_FOUND");

    await this.progressEventPublisher.publish({
      userId,
      courseId,
      moduleId: mod.id,
      lessonId,
      activityType: "lesson_viewed",
      occurredAt: new Date().toISOString(),
    });
  }
}
