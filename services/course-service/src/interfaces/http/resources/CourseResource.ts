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
      "/api/v1/courses/all",
      this.wrapAsync((req, res) => this.controller.listAllAvailableCourses(req, res))
    );

    this.app.post(
      "/api/v1/courses/generate",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.generate(req, res))
    );
    this.app.get(
      "/api/v1/courses",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.listCourses(req, res))
    );
    this.app.get(
      "/api/v1/courses/:id/status",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.getCourseStatus(req, res))
    );
    this.app.get(
      "/api/v1/courses/:id",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.getCourse(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
