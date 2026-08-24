import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { ProgressController } from "../controllers/ProgressController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class ProgressResource {
  constructor(
    private readonly app: Express,
    private readonly controller: ProgressController,
    private readonly authMiddleware: RequestHandler
  ) {}

  register(): void {
    this.app.get(
      "/dashboard",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.getDashboard(req, res))
    );
    this.app.get(
      "/courses/:id/progress",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.getCourseProgress(req, res))
    );
    this.app.get(
      "/courses/:id/module-status",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.getModuleStatus(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
