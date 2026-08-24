import type { ModuleStatusResponse } from "@ai-learning-platform/shared";

export interface IGetModuleStatusAction {
  execute(userId: string, courseId: string): Promise<ModuleStatusResponse[]>;
}
