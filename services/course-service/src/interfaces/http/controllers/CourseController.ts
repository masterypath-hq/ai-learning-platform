import type { Request, Response } from "express";
import type { ICourseService } from "../../../application/interfaces/ICourseService.js";
import { GenerateCourseRequest } from "../request/GenerateCourseRequest.js";
import type { AuthedRequest } from "../middleware/authMiddleware.js";
import { Subject, CourseStatus } from "@ai-learning-platform/shared";

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const;

/** Controller: HTTP → Request objects → Service. (SOLID: S, D — depends on ICourseService.) */
export class CourseController {
  constructor(private readonly courseService: ICourseService) {}

  async generate(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const parsed = GenerateCourseRequest.fromBody(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ error: parsed.error });
      return;
    }
    const result = await this.courseService.generateCourse(userId, parsed.request.dto);
    res.status(HTTP.OK).json(result);
  }

  async listCourses(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const subject = typeof req.query.subject === "string" ? (req.query.subject as Subject) : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as CourseStatus) : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const result = await this.courseService.listUserCourses(userId, subject, status, page, limit);
    res.status(HTTP.OK).json(result);
  }

  async getCourseStatus(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const { id } = req.params;
    try {
      const result = await this.courseService.getCourseStatus(id, userId);
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      if (e instanceof Error && e.message === "COURSE_FORBIDDEN") {
        res.status(HTTP.FORBIDDEN).json({ error: "Access denied." });
        return;
      }
      throw e;
    }
  }

  async getCourse(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const { id } = req.params;
    try {
      const result = await this.courseService.getCourse(id, userId);
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      if (e instanceof Error && e.message === "COURSE_FORBIDDEN") {
        res.status(HTTP.FORBIDDEN).json({ error: "Access denied." });
        return;
      }
      throw e;
    }
  }
}
