import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { CourseGenController } from "../controllers/CourseGenController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class CourseGenResource {
  constructor(
    private readonly app: Express,
    private readonly controller: CourseGenController,
    private readonly internalServiceMiddleware: RequestHandler
  ) {}

  register(): void {
    this.app.post(
      "/internal/courses/generate",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.generate(req, res))
    );
    this.app.post(
      "/internal/courses/outline",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.generateOutline(req, res))
    );
    this.app.post(
      "/internal/courses/modules/lessons",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.generateModuleLessons(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
