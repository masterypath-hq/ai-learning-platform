import type { Queue } from "bullmq";
import type {
  IEmailSender,
  WelcomeEmailParams,
  PasswordResetEmailParams,
  PasswordChangedEmailParams,
} from "../../application/interfaces/IEmailSender.js";
import type { EmailJobData } from "./EmailQueue.js";

export class QueuedEmailSender implements IEmailSender {
  constructor(private readonly queue: Queue<EmailJobData>) {}

  async sendWelcome(params: WelcomeEmailParams): Promise<void> {
    await this.queue.add("welcome", { type: "welcome", params });
  }

  async sendPasswordReset(params: PasswordResetEmailParams): Promise<void> {
    await this.queue.add("password-reset", { type: "password-reset", params });
  }

  async sendPasswordChanged(params: PasswordChangedEmailParams): Promise<void> {
    await this.queue.add("password-changed", { type: "password-changed", params });
  }
}
