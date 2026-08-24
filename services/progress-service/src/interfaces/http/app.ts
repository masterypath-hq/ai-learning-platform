import express from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ProgressController } from "./controllers/ProgressController.js";
import { ProgressResource } from "./resources/ProgressResource.js";

export class App {
  private readonly express: express.Express;

  constructor(progressController: ProgressController, authMiddleware: RequestHandler) {
    this.express = express();
    this.express.use(express.json());

    const progressResource = new ProgressResource(this.express, progressController, authMiddleware);
    progressResource.register();

    this.express.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", service: "progress" });
    });

    this.registerErrorHandler();
  }

  getInstance(): express.Express {
    return this.express;
  }

  private registerErrorHandler(): void {
    this.express.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("[progress-service] Unhandled error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, data: null, error: message });
      }
    });
  }
}
