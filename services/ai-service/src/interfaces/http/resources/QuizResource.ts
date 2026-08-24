import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { QuizController } from "../controllers/QuizController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class QuizResource {
  constructor(
    private readonly app: Express,
    private readonly controller: QuizController,
    private readonly authMiddleware: RequestHandler,
    private readonly internalServiceMiddleware: RequestHandler
  ) {}

  register(): void {
    this.app.post(
      "/quizzes/generate",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.generateKnowledgeCheck(req, res))
    );
    this.app.post(
      "/internal/quizzes/generate",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.generateInternal(req, res))
    );
    this.app.post(
      "/internal/quizzes/grade",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.grade(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
