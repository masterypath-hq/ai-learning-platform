import express from "express";
import type { Request, Response, NextFunction } from "express";
import type { AuthController } from "./controllers/AuthController.js";
import { AuthResource } from "./resources/AuthResource.js";

export class App {
  private readonly express: express.Express;

  constructor(authController: AuthController) {
    this.express = express();
    this.express.use(express.json());

    const authResource = new AuthResource(this.express, authController);
    authResource.register();

    this.express.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", service: "auth" });
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
      console.error("[auth-service] Unhandled error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: message });
      }
    });
  }
}
