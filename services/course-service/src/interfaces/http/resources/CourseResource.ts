import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { CourseController } from "../controllers/CourseController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class CourseResource {
  constructor(
    private readonly app: Express,
    private readonly controller: CourseController,
    private readonly authMiddleware: RequestHandler
  ) {}

  register(): void {
    this.app.get(
      "/api/v1/courses",
      this.wrapAsync((req, res) => this.controller.listAllCourses(req, res))
    );
    this.app.get(
      "/api/v1/courses/me",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.listMyCourses(req, res))
    );
    this.app.get(
      "/api/v1/courses/:id",
      this.wrapAsync((req, res) => this.controller.getCourse(req, res))
    );
    this.app.get(
      "/api/v1/courses/:id/modules",
      this.wrapAsync((req, res) => this.controller.getModulesByCourse(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
