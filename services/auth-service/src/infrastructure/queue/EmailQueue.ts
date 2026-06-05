import { Queue } from "bullmq";
import type {
  WelcomeEmailParams,
  PasswordResetEmailParams,
  PasswordChangedEmailParams,
} from "../../application/interfaces/IEmailSender.js";
import { createBullmqConnection } from "./bullmqConnection.js";

export type EmailJobData =
  | { type: "welcome"; params: WelcomeEmailParams }
  | { type: "password-reset"; params: PasswordResetEmailParams }
  | { type: "password-changed"; params: PasswordChangedEmailParams };

export const EMAIL_QUEUE_NAME = "email";

export function createEmailQueue(redisUrl: string): Queue<EmailJobData> {
  return new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: createBullmqConnection(redisUrl),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    },
  });
}
