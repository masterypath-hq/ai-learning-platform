import type { DashboardResponse } from "@ai-learning-platform/shared";

export interface IGetDashboardAction {
  execute(userId: string): Promise<DashboardResponse>;
}
