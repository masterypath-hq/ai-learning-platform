import type { Request, Response } from "express";
import { GenerateQuizRequestSchema, GradeShortAnswersRequestSchema } from "@ai-learning-platform/shared";
import type { IGenerateQuizAction } from "../../../application/interfaces/IGenerateQuizAction.js";
import type { IGradeShortAnswersAction } from "../../../application/interfaces/IGradeShortAnswersAction.js";

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
} as const;

export class QuizController {
  constructor(
    private readonly generateQuizAction: IGenerateQuizAction,
    private readonly gradeShortAnswersAction: IGradeShortAnswersAction
  ) {}

  /** Public, JWT-authed — client-facing. Only knowledge checks may be generated here: the
   * answer key would otherwise be visible in the browser network tab before the learner
   * answers. Module/course-final quizzes are generated via generateInternal, called
   * server-to-server by assessment-service, which withholds the answer key from the client. */
  async generateKnowledgeCheck(req: Request, res: Response): Promise<void> {
    const parsed = GenerateQuizRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    if (parsed.data.type !== "knowledge_check") {
      res.status(HTTP.BAD_REQUEST).json({
        success: false,
        data: null,
        error: "Only knowledge_check quizzes can be generated on this endpoint.",
      });
      return;
    }
    const content = await this.generateQuizAction.execute(parsed.data);
    res.status(HTTP.OK).json({ success: true, data: content, error: null });
  }

  /** Internal-secret-protected — called by assessment-service to generate graded quizzes. */
  async generateInternal(req: Request, res: Response): Promise<void> {
    const parsed = GenerateQuizRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    const content = await this.generateQuizAction.execute(parsed.data);
    res.status(HTTP.OK).json({ success: true, data: content, error: null });
  }

  /** Internal-secret-protected — called by assessment-service to grade short-answer questions. */
  async grade(req: Request, res: Response): Promise<void> {
    const parsed = GradeShortAnswersRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    const result = await this.gradeShortAnswersAction.execute(parsed.data);
    res.status(HTTP.OK).json({ success: true, data: result, error: null });
  }
}
