import type { Request, Response } from "express";
import {
  StartQuizAttemptRequestSchema,
  SubmitQuizAttemptRequestSchema,
  RecordKnowledgeCheckCompletionRequestSchema,
} from "@ai-learning-platform/shared";
import type { IStartQuizAttemptAction } from "../../../application/interfaces/IStartQuizAttemptAction.js";
import type { ISubmitQuizAttemptAction } from "../../../application/interfaces/ISubmitQuizAttemptAction.js";
import type { IListQuizAttemptsAction } from "../../../application/interfaces/IListQuizAttemptsAction.js";
import type { IRecordKnowledgeCheckCompletionAction } from "../../../application/interfaces/IRecordKnowledgeCheckCompletionAction.js";
import type { IGetRecentQuizAttemptsAction } from "../../../application/interfaces/IGetRecentQuizAttemptsAction.js";
import { CooldownActiveError } from "../../../application/errors/CooldownActiveError.js";
import { toQuizAttemptResponse } from "../../../application/mappers/toQuizAttemptResponse.js";
import type { AuthedRequest } from "../middleware/authMiddleware.js";

const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class QuizAttemptController {
  constructor(
    private readonly startQuizAttemptAction: IStartQuizAttemptAction,
    private readonly submitQuizAttemptAction: ISubmitQuizAttemptAction,
    private readonly listQuizAttemptsAction: IListQuizAttemptsAction,
    private readonly recordKnowledgeCheckCompletionAction: IRecordKnowledgeCheckCompletionAction,
    private readonly getRecentQuizAttemptsAction: IGetRecentQuizAttemptsAction
  ) {}

  async start(req: Request, res: Response): Promise<void> {
    const parsed = StartQuizAttemptRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    const userId = (req as AuthedRequest).userId;
    try {
      const attempt = await this.startQuizAttemptAction.execute(userId, parsed.data);
      res.status(HTTP.CREATED).json({ success: true, data: toQuizAttemptResponse(attempt), error: null });
    } catch (e) {
      if (e instanceof CooldownActiveError) {
        res.status(HTTP.CONFLICT).json({
          success: false,
          data: null,
          error: { message: "A cool-down is active for this quiz.", retryAvailableAt: e.retryAvailableAt.toISOString() },
        });
        return;
      }
      throw e;
    }
  }

  async submit(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const parsed = SubmitQuizAttemptRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    const userId = (req as AuthedRequest).userId;
    try {
      const attempt = await this.submitQuizAttemptAction.execute(userId, id, parsed.data.answers);
      res.status(HTTP.OK).json({ success: true, data: toQuizAttemptResponse(attempt), error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "ATTEMPT_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Attempt not found." });
        return;
      }
      if (e instanceof Error && e.message === "ATTEMPT_FORBIDDEN") {
        res.status(HTTP.FORBIDDEN).json({ success: false, data: null, error: "Access denied." });
        return;
      }
      if (e instanceof Error && e.message === "ATTEMPT_ALREADY_SUBMITTED") {
        res.status(HTTP.CONFLICT).json({ success: false, data: null, error: "This attempt was already submitted." });
        return;
      }
      throw e;
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    const { courseId } = req.query as { courseId?: string };
    if (!courseId) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: "courseId query parameter is required." });
      return;
    }
    const userId = (req as AuthedRequest).userId;
    const attempts = await this.listQuizAttemptsAction.execute(userId, courseId);
    res.status(HTTP.OK).json({ success: true, data: attempts.map(toQuizAttemptResponse), error: null });
  }

  async recordKnowledgeCheckCompletion(req: Request, res: Response): Promise<void> {
    const parsed = RecordKnowledgeCheckCompletionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    const userId = (req as AuthedRequest).userId;
    await this.recordKnowledgeCheckCompletionAction.execute(userId, parsed.data);
    res.status(HTTP.CREATED).json({ success: true, data: null, error: null });
  }

  async listRecentInternal(req: Request, res: Response): Promise<void> {
    const { userId } = req.query as { userId?: string };
    const limit = Number(req.query.limit) || 5;
    if (!userId) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: "userId query parameter is required." });
      return;
    }
    const attempts = await this.getRecentQuizAttemptsAction.execute(userId, limit);
    res.status(HTTP.OK).json({
      success: true,
      data: attempts.map((a) => ({
        id: a.id,
        courseId: a.courseId,
        score: a.score ?? 0,
        passed: a.passed ?? false,
        submittedAt: a.submittedAt ? a.submittedAt.toISOString() : "",
      })),
      error: null,
    });
  }
}
