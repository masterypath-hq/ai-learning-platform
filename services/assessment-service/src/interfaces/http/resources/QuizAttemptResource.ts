import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { QuizAttemptController } from "../controllers/QuizAttemptController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class QuizAttemptResource {
  constructor(
    private readonly app: Express,
    private readonly controller: QuizAttemptController,
    private readonly authMiddleware: RequestHandler,
    private readonly internalServiceMiddleware: RequestHandler
  ) {}

  register(): void {
    this.app.post(
      "/attempts",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.start(req, res))
    );
    this.app.post(
      "/attempts/:id/submit",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.submit(req, res))
    );
    this.app.get(
      "/attempts",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.list(req, res))
    );
    this.app.post(
      "/knowledge-checks/completed",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.recordKnowledgeCheckCompletion(req, res))
    );
    this.app.get(
      "/internal/attempts/recent",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.listRecentInternal(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
