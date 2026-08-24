import cors from "cors";
import express from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AuthController } from "./controllers/AuthController.js";
import { AuthResource } from "./resources/AuthResource.js";
import type { WaitlistController } from "./controllers/WaitlistController.js";
import { WaitlistResource } from "./resources/WaitlistResource.js";
import type { BillingController } from "./controllers/BillingController.js";
import { BillingResource } from "./resources/BillingResource.js";

export class App {
  private readonly express: express.Express;

  constructor(
    authController: AuthController,
    bearerAuth: RequestHandler,
    waitlistController: WaitlistController,
    billingController: BillingController
  ) {
    this.express = express();
    this.express.use(cors({ origin: "*", allowedHeaders: ["Content-Type", "Authorization"], methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));

    // Stripe/Paystack webhooks need the raw body for signature verification —
    // must be mounted before the global express.json() below consumes it.
    const billingResource = new BillingResource(this.express, billingController, bearerAuth);
    billingResource.registerWebhooks();

    this.express.use(express.json());

    const authResource = new AuthResource(this.express, authController, bearerAuth);
    authResource.register();

    const waitlistResource = new WaitlistResource(this.express, waitlistController);
    waitlistResource.register();

    billingResource.registerAuthenticated();

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
