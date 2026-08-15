import type { ProgressEvent } from "@ai-learning-platform/shared";

export interface IProgressEventPublisher {
  publish(event: ProgressEvent): Promise<void>;
}
