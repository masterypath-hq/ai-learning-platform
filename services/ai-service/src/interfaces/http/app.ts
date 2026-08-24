import express from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ChatController } from "./controllers/ChatController.js";
import type { CourseGenController } from "./controllers/CourseGenController.js";
import type { QuizController } from "./controllers/QuizController.js";
import { ChatResource } from "./resources/ChatResource.js";
import { CourseGenResource } from "./resources/CourseGenResource.js";
import { QuizResource } from "./resources/QuizResource.js";

export class App {
  private readonly express: express.Express;

  constructor(
    chatController: ChatController,
    authMiddleware: RequestHandler,
    courseGenController: CourseGenController,
    quizController: QuizController,
    internalServiceMiddleware: RequestHandler
  ) {
    this.express = express();
    this.express.use(express.json());

    const chatResource = new ChatResource(this.express, chatController, authMiddleware);
    chatResource.register();

    const courseGenResource = new CourseGenResource(this.express, courseGenController, internalServiceMiddleware);
    courseGenResource.register();

    const quizResource = new QuizResource(this.express, quizController, authMiddleware, internalServiceMiddleware);
    quizResource.register();

    this.express.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", service: "ai" });
    });

    this.registerErrorHandler();
  }

  getInstance(): express.Express {
    return this.express;
  }

  private registerErrorHandler(): void {
    this.express.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("[ai-service] Unhandled error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, data: null, error: message });
      }
    });
  }
}
