import type { ProgressEvent } from "@ai-learning-platform/shared";

export interface IRecordProgressEventAction {
  execute(event: ProgressEvent): Promise<void>;
}
