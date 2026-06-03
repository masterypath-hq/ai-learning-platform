import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type {
  WelcomeEmailParams,
  PasswordResetEmailParams,
  PasswordChangedEmailParams,
} from "../../application/interfaces/IEmailSender.js";

export type EmailJobData =
  | { type: "welcome"; params: WelcomeEmailParams }
  | { type: "password-reset"; params: PasswordResetEmailParams }
  | { type: "password-changed"; params: PasswordChangedEmailParams };

export const EMAIL_QUEUE_NAME = "email";

export function createEmailQueue(redisUrl: string): Queue<EmailJobData> {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  return new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    },
  });
}
