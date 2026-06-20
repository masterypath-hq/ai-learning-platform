import { Worker } from "bullmq";
import type { IEmailSender } from "../../application/interfaces/IEmailSender.js";
import { createBullmqConnection } from "./bullmqConnection.js";
import { EMAIL_QUEUE_NAME, type EmailJobData } from "./EmailQueue.js";

export function createEmailWorker(redisUrl: string, emailSender: IEmailSender): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { type, params } = job.data;
      switch (type) {
        case "welcome":
          await emailSender.sendWelcome(params);
          break;
        case "password-reset":
          await emailSender.sendPasswordReset(params);
          break;
        case "password-changed":
          await emailSender.sendPasswordChanged(params);
          break;
      }
    },
    { connection: createBullmqConnection(redisUrl) }
  );

  worker.on("completed", (job) => {
    console.log(`[EmailWorker] ${job.data.type} email sent (job ${job.id})`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[EmailWorker] ${job?.data.type} email failed (job ${job?.id}):`, err.message);
  });

  return worker;
}
