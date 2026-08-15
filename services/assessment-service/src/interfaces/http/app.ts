import express from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { QuizAttemptController } from "./controllers/QuizAttemptController.js";
import { QuizAttemptResource } from "./resources/QuizAttemptResource.js";

export class App {
  private readonly express: express.Express;

  constructor(
    quizAttemptController: QuizAttemptController,
    authMiddleware: RequestHandler,
    internalServiceMiddleware: RequestHandler
  ) {
    this.express = express();
    this.express.use(express.json());

    const quizAttemptResource = new QuizAttemptResource(
      this.express,
      quizAttemptController,
      authMiddleware,
      internalServiceMiddleware
    );
    quizAttemptResource.register();

    this.express.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", service: "assessment" });
    });

    this.registerErrorHandler();
  }

  getInstance(): express.Express {
    return this.express;
  }

  private registerErrorHandler(): void {
    this.express.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("[assessment-service] Unhandled error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, data: null, error: message });
      }
    });
  }
}
