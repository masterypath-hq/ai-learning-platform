import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import type { ChatController } from "../controllers/ChatController.js";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class ChatResource {
  constructor(
    private readonly app: Express,
    private readonly controller: ChatController,
    private readonly authMiddleware: RequestHandler
  ) {}

  register(): void {
    this.app.post(
      "/chat/sessions",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.createSession(req, res))
    );
    this.app.get(
      "/chat/sessions",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.listSessions(req, res))
    );
    this.app.get(
      "/chat/sessions/:id/messages",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.listMessages(req, res))
    );
    this.app.post(
      "/chat/sessions/:id/messages",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.sendMessage(req, res))
    );
    this.app.post(
      "/chat/sessions/:id/close",
      this.authMiddleware,
      this.wrapAsync((req, res) => this.controller.closeSession(req, res))
    );
  }

  private wrapAsync(handler: AsyncHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      handler(req, res, next).catch(next);
    };
  }
}
