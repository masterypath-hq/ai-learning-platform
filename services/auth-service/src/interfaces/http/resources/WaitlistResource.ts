import type { Express, Request, Response, NextFunction } from "express";
import type { WaitlistController } from "../controllers/WaitlistController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class WaitlistResource {
  constructor(
    private readonly app: Express,
    private readonly controller: WaitlistController
  ) {}

  register(): void {
    this.app.post("/api/v1/auth/waitlist", this.wrapAsync((req, res) => this.controller.join(req, res)));
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
