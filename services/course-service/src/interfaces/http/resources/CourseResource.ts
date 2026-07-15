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
    this.app.post(
      "/api/v1/courses/:id/enroll",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.enrollInCourse(req, res))
    );
    this.app.get(
      "/api/v1/tracks",
      this.wrapAsync((req, res) => this.controller.listTracks(req, res))
    );
    this.app.get(
      "/api/v1/courses/:id/skills",
      this.wrapAsync((req, res) => this.controller.listSkills(req, res))
    );
    this.app.get(
      "/api/v1/courses/:id/placement-question",
      this.wrapAsync((req, res) => this.controller.getPlacementQuestion(req, res))
    );
    this.app.post(
      "/api/v1/courses/:id/onboarding",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.completeOnboarding(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
