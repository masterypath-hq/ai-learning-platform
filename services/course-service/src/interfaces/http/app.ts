import express from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { CourseController } from "./controllers/CourseController.js";
import { CourseResource } from "./resources/CourseResource.js";

export class App {
  private readonly express: express.Express;

  constructor(
    courseController: CourseController,
    authMiddleware: RequestHandler,
    internalServiceMiddleware: RequestHandler
  ) {
    this.express = express();
    this.express.use(express.json());

    const courseResource = new CourseResource(this.express, courseController, authMiddleware, internalServiceMiddleware);
    courseResource.register();

    this.express.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", service: "course" });
    });

    this.registerErrorHandler();
  }

  getInstance(): express.Express {
    return this.express;
  }

  listen(port: number, callback?: () => void): void {
    this.express.listen(port, callback);
  }

  private registerErrorHandler(): void {
    this.express.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("[course-service] Unhandled error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: message });
      }
    });
  }
}
