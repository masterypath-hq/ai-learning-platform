import type { RecordKnowledgeCheckCompletionRequest } from "@ai-learning-platform/shared";

export interface IRecordKnowledgeCheckCompletionAction {
  execute(userId: string, request: RecordKnowledgeCheckCompletionRequest): Promise<void>;
}
