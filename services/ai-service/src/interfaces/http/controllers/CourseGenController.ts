import type { Request, Response } from "express";
import { GenerateCourseContentRequestSchema } from "@ai-learning-platform/shared";
import type { IGenerateCourseContentAction } from "../../../application/interfaces/IGenerateCourseContentAction.js";

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
} as const;

export class CourseGenController {
  constructor(private readonly generateCourseContentAction: IGenerateCourseContentAction) {}

  async generate(req: Request, res: Response): Promise<void> {
    const parsed = GenerateCourseContentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    const content = await this.generateCourseContentAction.execute(parsed.data);
    res.status(HTTP.OK).json({ success: true, data: content, error: null });
  }
}
