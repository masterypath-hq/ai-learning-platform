import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { CourseController } from "../controllers/CourseController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class CourseResource {
  constructor(
    private readonly app: Express,
    private readonly controller: CourseController,
    private readonly authMiddleware: RequestHandler,
    private readonly internalServiceMiddleware: RequestHandler
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
      "/api/v1/courses/placement-questions/:questionId/check",
      this.wrapAsync((req, res) => this.controller.checkPlacementAnswer(req, res))
    );
    this.app.post(
      "/api/v1/courses/:id/onboarding",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.completeOnboarding(req, res))
    );
    this.app.post(
      "/api/v1/courses/:id/content",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.persistContent(req, res))
    );
    this.app.get(
      "/api/v1/lessons/:id",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.getLesson(req, res))
    );
    this.app.get(
      "/api/v1/modules/:id",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.getModule(req, res))
    );
    this.app.post(
      "/api/v1/courses/:courseId/lessons/:lessonId/viewed",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.markLessonViewed(req, res))
    );
    this.app.get(
      "/api/v1/internal/enrollments/:userId",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.listEnrollmentsInternal(req, res))
    );
    this.app.get(
      "/api/v1/courses/:id/generation/status",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.getGenerationStatus(req, res))
    );
    this.app.post(
      "/api/v1/courses/:id/generation/outline",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.persistGenerationOutline(req, res))
    );
    this.app.post(
      "/api/v1/courses/:id/generation/modules/:moduleId/lessons",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.persistGenerationModuleLessons(req, res))
    );
    this.app.delete(
      "/api/v1/courses/:id/generation",
      this.internalServiceMiddleware,
      this.wrapAsync((req, res) => this.controller.clearGeneratedContent(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
