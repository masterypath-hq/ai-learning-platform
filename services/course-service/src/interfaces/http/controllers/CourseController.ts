import type { Request, Response } from "express";
import type { ICourseService } from "../../../application/interfaces/ICourseService.js";
import type { AuthedRequest } from "../middleware/authMiddleware.js";

const HTTP = {
  OK: 200,
  NOT_FOUND: 404,
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
}
