import type { Request, Response } from "express";
import type { ICourseService } from "../../../application/interfaces/ICourseService.js";
import type { AuthedRequest } from "../middleware/authMiddleware.js";

const HTTP = {
  OK: 200,
  CREATED: 201,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class CourseController {
  constructor(private readonly courseService: ICourseService) {}

  async listAllCourses(_req: Request, res: Response): Promise<void> {
    console.log('hshfs');
    const result = await this.courseService.listAllCourses();
    res.status(HTTP.OK).json(result);
  }

  async listMyCourses(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const result = await this.courseService.listMyCourses(userId);
    res.status(HTTP.OK).json(result);
  }

  async getCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.courseService.getCourse(id);
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      throw e;
    }
  }

  async getModulesByCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.courseService.getModulesByCourseId(id);
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      throw e;
    }
  }

  async enrollInCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as AuthedRequest).userId;
    try {
      const result = await this.courseService.enrollCourse(id, userId);
      res.status(HTTP.CREATED).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      if (e instanceof Error && e.message === "ALREADY_ENROLLED") {
        res.status(HTTP.CONFLICT).json({ error: "Already enrolled in this course." });
        return;
      }
      throw e;
    }
  }

  async listTracks(_req: Request, res: Response): Promise<void> {
    const result = await this.courseService.listTracks();
    res.status(HTTP.OK).json(result);
  }

  async chooseTrack(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const { trackSlug } = req.body as { trackSlug: string };
    try {
      const result = await this.courseService.chooseTrack(trackSlug, userId);
      res.status(HTTP.CREATED).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Track not found." });
        return;
      }
      if (e instanceof Error && e.message === "ALREADY_ENROLLED") {
        res.status(HTTP.CONFLICT).json({ error: "Already enrolled in this track." });
        return;
      }
      throw e;
    }
  }
}
