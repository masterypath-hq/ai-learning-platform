import type { Request, Response } from "express";
import type { ICreateChatSessionAction } from "../../../application/interfaces/ICreateChatSessionAction.js";
import type { ISendChatMessageAction } from "../../../application/interfaces/ISendChatMessageAction.js";
import type { ICloseChatSessionAction } from "../../../application/interfaces/ICloseChatSessionAction.js";
import type { IListChatSessionsAction } from "../../../application/interfaces/IListChatSessionsAction.js";
import type { IListChatMessagesAction } from "../../../application/interfaces/IListChatMessagesAction.js";
import { parseCreateChatSessionRequest } from "../request/CreateChatSessionRequest.js";
import { parseSendChatMessageRequest } from "../request/SendChatMessageRequest.js";
import type { AuthedRequest } from "../middleware/authMiddleware.js";

const HTTP = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

function mapSessionError(message: string): { status: number; error: string } | null {
  switch (message) {
    case "SESSION_NOT_FOUND":
      return { status: HTTP.NOT_FOUND, error: "Chat session not found." };
    case "SESSION_FORBIDDEN":
      return { status: HTTP.FORBIDDEN, error: "Access denied." };
    case "SESSION_CLOSED":
      return { status: HTTP.CONFLICT, error: "This chat session is closed." };
    case "SESSION_BUSY":
      return { status: HTTP.CONFLICT, error: "A reply is already streaming for this session." };
    case "LESSON_NOT_FOUND":
      return { status: HTTP.NOT_FOUND, error: "Lesson not found." };
    case "MODULE_NOT_FOUND":
      return { status: HTTP.NOT_FOUND, error: "Module not found for this lesson." };
    case "CONVERSATION_ALREADY_STARTED":
      return { status: HTTP.CONFLICT, error: "This conversation has already started." };
    default:
      return null;
  }
}

export class ChatController {
  constructor(
    private readonly createChatSessionAction: ICreateChatSessionAction,
    private readonly sendChatMessageAction: ISendChatMessageAction,
    private readonly closeChatSessionAction: ICloseChatSessionAction,
    private readonly listChatSessionsAction: IListChatSessionsAction,
    private readonly listChatMessagesAction: IListChatMessagesAction
  ) {}

  async listSessions(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const sessions = await this.listChatSessionsAction.execute(userId);
    res.status(HTTP.OK).json({ success: true, data: sessions, error: null });
  }

  async listMessages(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const { id: sessionId } = req.params;
    try {
      const messages = await this.listChatMessagesAction.execute(userId, sessionId);
      res.status(HTTP.OK).json({ success: true, data: messages, error: null });
    } catch (e) {
      const mapped = e instanceof Error ? mapSessionError(e.message) : null;
      if (mapped) {
        res.status(mapped.status).json({ success: false, data: null, error: mapped.error });
        return;
      }
      throw e;
    }
  }

  async createSession(req: Request, res: Response): Promise<void> {
    const parsed = parseCreateChatSessionRequest(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error });
      return;
    }
    const userId = (req as AuthedRequest).userId;
    try {
      const session = await this.createChatSessionAction.execute(userId, parsed.request);
      res.status(HTTP.CREATED).json({ success: true, data: session, error: null });
    } catch (e) {
      const mapped = e instanceof Error ? mapSessionError(e.message) : null;
      if (mapped) {
        res.status(mapped.status).json({ success: false, data: null, error: mapped.error });
        return;
      }
      throw e;
    }
  }

  async startConversation(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const { id: sessionId } = req.params;
    try {
      await this.sendChatMessageAction.startConversation(userId, sessionId);
      res.status(HTTP.ACCEPTED).json({ success: true, data: null, error: null });
    } catch (e) {
      const mapped = e instanceof Error ? mapSessionError(e.message) : null;
      if (mapped) {
        res.status(mapped.status).json({ success: false, data: null, error: mapped.error });
        return;
      }
      throw e;
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    const parsed = parseSendChatMessageRequest(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error });
      return;
    }
    const userId = (req as AuthedRequest).userId;
    const { id: sessionId } = req.params;
    try {
      const message = await this.sendChatMessageAction.execute(userId, sessionId, parsed.request.content);
      res.status(HTTP.ACCEPTED).json({ success: true, data: message, error: null });
    } catch (e) {
      const mapped = e instanceof Error ? mapSessionError(e.message) : null;
      if (mapped) {
        res.status(mapped.status).json({ success: false, data: null, error: mapped.error });
        return;
      }
      throw e;
    }
  }

  async closeSession(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const { id: sessionId } = req.params;
    try {
      const session = await this.closeChatSessionAction.execute(userId, sessionId);
      res.status(HTTP.OK).json({ success: true, data: session, error: null });
    } catch (e) {
      const mapped = e instanceof Error ? mapSessionError(e.message) : null;
      if (mapped) {
        res.status(mapped.status).json({ success: false, data: null, error: mapped.error });
        return;
      }
      throw e;
    }
  }
}
