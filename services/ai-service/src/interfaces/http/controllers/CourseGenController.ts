import type { Request, Response } from "express";
import {
  GenerateCourseContentRequestSchema,
  GenerateModuleLessonsRequestSchema,
} from "@ai-learning-platform/shared";
import type { IGenerateCourseContentAction } from "../../../application/interfaces/IGenerateCourseContentAction.js";
import type { IGenerateCourseOutlineAction } from "../../../application/interfaces/IGenerateCourseOutlineAction.js";
import type { IGenerateModuleLessonsAction } from "../../../application/interfaces/IGenerateModuleLessonsAction.js";

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
} as const;

export class CourseGenController {
  constructor(
    private readonly generateCourseContentAction: IGenerateCourseContentAction,
    private readonly generateCourseOutlineAction: IGenerateCourseOutlineAction,
    private readonly generateModuleLessonsAction: IGenerateModuleLessonsAction
  ) {}

  async generate(req: Request, res: Response): Promise<void> {
    const parsed = GenerateCourseContentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    const content = await this.generateCourseContentAction.execute(parsed.data);
    res.status(HTTP.OK).json({ success: true, data: content, error: null });
  }

  async generateOutline(req: Request, res: Response): Promise<void> {
    const parsed = GenerateCourseContentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, usage: null, error: parsed.error.flatten() });
      return;
    }
    const { trackSlug, title, description } = parsed.data;
    const { data, usage } = await this.generateCourseOutlineAction.execute(trackSlug, title, description);
    res.status(HTTP.OK).json({ success: true, data, usage, error: null });
  }

  async generateModuleLessons(req: Request, res: Response): Promise<void> {
    const parsed = GenerateModuleLessonsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, usage: null, error: parsed.error.flatten() });
      return;
    }
    const { trackSlug, module } = parsed.data;
    const { data, usage } = await this.generateModuleLessonsAction.execute(trackSlug, module);
    res.status(HTTP.OK).json({ success: true, data, usage, error: null });
  }
}
