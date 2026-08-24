import type { Request, Response } from "express";
import type { IJoinWaitlistAction } from "../../../application/interfaces/IJoinWaitlistAction.js";
import { JoinWaitlistRequest } from "../request/JoinWaitlistRequest.js";

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
} as const;

export class WaitlistController {
  constructor(private readonly joinWaitlistAction: IJoinWaitlistAction) {}

  async join(req: Request, res: Response): Promise<void> {
    const parsed = JoinWaitlistRequest.fromBody(req.body);
    if (!parsed.ok) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error });
      return;
    }
    const result = await this.joinWaitlistAction.execute(parsed.request.email, parsed.request.source);
    res.status(HTTP.OK).json({ success: true, data: result, error: null });
  }
}
