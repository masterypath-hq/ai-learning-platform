import { createInternalServiceMiddleware } from "@ai-learning-platform/shared";
import { createPgPool } from "@ai-learning-platform/shared/pg-pool";
import { PgQuizAttemptRepository } from "./infrastructure/persistence/PgQuizAttemptRepository.js";
import { AiServiceClient } from "./infrastructure/http/AiServiceClient.js";
import { RedisProgressEventPublisher } from "./infrastructure/redis/RedisProgressEventPublisher.js";
import { getRedisClient } from "./lib/redis.js";
import { StartQuizAttemptAction } from "./application/actions/StartQuizAttemptAction.js";
import { SubmitQuizAttemptAction } from "./application/actions/SubmitQuizAttemptAction.js";
import { ListQuizAttemptsAction } from "./application/actions/ListQuizAttemptsAction.js";
import { RecordKnowledgeCheckCompletionAction } from "./application/actions/RecordKnowledgeCheckCompletionAction.js";
import { GetRecentQuizAttemptsAction } from "./application/actions/GetRecentQuizAttemptsAction.js";
import { createAuthMiddleware } from "./interfaces/http/middleware/authMiddleware.js";
import { QuizAttemptController } from "./interfaces/http/controllers/QuizAttemptController.js";
import { App } from "./interfaces/http/app.js";

const DEFAULT_DATABASE_URL = "postgresql://assessment:assessment@localhost:5432/assessment";

export async function createCompositionRoot() {
  const raw = process.env.ASSESSMENT_DATABASE_URL ?? process.env.DATABASE_URL;
  const connectionString = raw && raw.trim() !== "" ? raw : DEFAULT_DATABASE_URL;

  if (!raw || raw.trim() === "") {
    console.error("[assessment-service] ASSESSMENT_DATABASE_URL (or DATABASE_URL) is not set. Set it in .env.");
  }

  const pool = await createPgPool("assessment-service", connectionString);

  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = getRedisClient(redisUrl);

  const attemptRepo = new PgQuizAttemptRepository(pool);

  const aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://ai-service:5002";
  const internalServiceSecret = process.env.INTERNAL_SERVICE_SECRET ?? "dev-internal-secret-change-in-production";
  const quizServiceClient = new AiServiceClient(aiServiceUrl, internalServiceSecret);

  const progressEventPublisher = new RedisProgressEventPublisher(redis);

  const startQuizAttemptAction = new StartQuizAttemptAction(attemptRepo, quizServiceClient);
  const submitQuizAttemptAction = new SubmitQuizAttemptAction(attemptRepo, quizServiceClient, progressEventPublisher);
  const listQuizAttemptsAction = new ListQuizAttemptsAction(attemptRepo);
  const recordKnowledgeCheckCompletionAction = new RecordKnowledgeCheckCompletionAction(progressEventPublisher);
  const getRecentQuizAttemptsAction = new GetRecentQuizAttemptsAction(attemptRepo);

  const quizAttemptController = new QuizAttemptController(
    startQuizAttemptAction,
    submitQuizAttemptAction,
    listQuizAttemptsAction,
    recordKnowledgeCheckCompletionAction,
    getRecentQuizAttemptsAction
  );

  const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const authMiddleware = createAuthMiddleware(jwtSecret);
  const internalServiceMiddleware = createInternalServiceMiddleware(internalServiceSecret);

  const app = new App(quizAttemptController, authMiddleware, internalServiceMiddleware);

  return { app, pool };
}
