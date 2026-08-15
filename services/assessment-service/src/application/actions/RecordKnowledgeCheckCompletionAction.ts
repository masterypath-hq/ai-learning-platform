import type { RecordKnowledgeCheckCompletionRequest } from "@ai-learning-platform/shared";
import type { IProgressEventPublisher } from "../interfaces/IProgressEventPublisher.js";
import type { IRecordKnowledgeCheckCompletionAction } from "../interfaces/IRecordKnowledgeCheckCompletionAction.js";

export class RecordKnowledgeCheckCompletionAction implements IRecordKnowledgeCheckCompletionAction {
  constructor(private readonly progressEventPublisher: IProgressEventPublisher) {}

  async execute(userId: string, request: RecordKnowledgeCheckCompletionRequest): Promise<void> {
    await this.progressEventPublisher.publish({
      userId,
      courseId: request.courseId,
      moduleId: request.moduleId ?? null,
      lessonId: request.lessonId,
      activityType: "knowledge_check_completed",
      occurredAt: new Date().toISOString(),
    });
  }
}
