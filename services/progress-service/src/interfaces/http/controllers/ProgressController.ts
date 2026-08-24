import type { Request, Response } from "express";
import type { IGetDashboardAction } from "../../../application/interfaces/IGetDashboardAction.js";
import type { IGetCourseProgressAction } from "../../../application/interfaces/IGetCourseProgressAction.js";
import type { IGetModuleStatusAction } from "../../../application/interfaces/IGetModuleStatusAction.js";
import type { AuthedRequest } from "../middleware/authMiddleware.js";

const HTTP = {
  OK: 200,
} as const;

export class ProgressController {
  constructor(
    private readonly getDashboardAction: IGetDashboardAction,
    private readonly getCourseProgressAction: IGetCourseProgressAction,
    private readonly getModuleStatusAction: IGetModuleStatusAction
  ) {}

  async getDashboard(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const result = await this.getDashboardAction.execute(userId);
    res.status(HTTP.OK).json({ success: true, data: result, error: null });
  }

  async getCourseProgress(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const { id } = req.params;
    const result = await this.getCourseProgressAction.execute(userId, id);
    res.status(HTTP.OK).json({ success: true, data: result, error: null });
  }

  async getModuleStatus(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const { id } = req.params;
    const result = await this.getModuleStatusAction.execute(userId, id);
    res.status(HTTP.OK).json({ success: true, data: result, error: null });
  }
}
