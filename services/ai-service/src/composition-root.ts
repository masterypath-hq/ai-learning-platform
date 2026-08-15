import Anthropic from "@anthropic-ai/sdk";
import { PgChatSessionRepository } from "./infrastructure/persistence/PgChatSessionRepository.js";
import { PgChatMessageRepository } from "./infrastructure/persistence/PgChatMessageRepository.js";
import { ClaudeTutorStreamer } from "./infrastructure/ai/ClaudeTutorStreamer.js";
import { ClaudeChatSummaryGenerator } from "./infrastructure/ai/ClaudeChatSummaryGenerator.js";
import { ClaudeCourseContentGenerator } from "./infrastructure/ai/ClaudeCourseContentGenerator.js";
import { ClaudeQuizGenerator } from "./infrastructure/ai/ClaudeQuizGenerator.js";
import { CourseServiceClient } from "./infrastructure/http/CourseServiceClient.js";
import { RedisChatStreamPublisher } from "./infrastructure/redis/RedisChatStreamPublisher.js";
import { getRedisClient } from "./lib/redis.js";
import { CreateChatSessionAction } from "./application/actions/CreateChatSessionAction.js";
import { SendChatMessageAction } from "./application/actions/SendChatMessageAction.js";
import { CloseChatSessionAction } from "./application/actions/CloseChatSessionAction.js";
import { ListChatSessionsAction } from "./application/actions/ListChatSessionsAction.js";
import { ListChatMessagesAction } from "./application/actions/ListChatMessagesAction.js";
import { RedisProgressEventPublisher } from "./infrastructure/redis/RedisProgressEventPublisher.js";
import { GenerateCourseContentAction } from "./application/actions/GenerateCourseContentAction.js";
import { GenerateQuizAction } from "./application/actions/GenerateQuizAction.js";
import { GradeShortAnswersAction } from "./application/actions/GradeShortAnswersAction.js";
import { createAuthMiddleware } from "./interfaces/http/middleware/authMiddleware.js";
import { createInternalServiceMiddleware, createPgPool } from "@ai-learning-platform/shared";
import { ChatController } from "./interfaces/http/controllers/ChatController.js";
import { CourseGenController } from "./interfaces/http/controllers/CourseGenController.js";
import { QuizController } from "./interfaces/http/controllers/QuizController.js";
import { App } from "./interfaces/http/app.js";

const DEFAULT_DATABASE_URL = "postgresql://ai:ai@localhost:5432/ai";

export async function createCompositionRoot() {
  const raw = process.env.AI_DATABASE_URL ?? process.env.DATABASE_URL;
  const connectionString = raw && raw.trim() !== "" ? raw : DEFAULT_DATABASE_URL;

  if (!raw || raw.trim() === "") {
    console.error("[ai-service] AI_DATABASE_URL (or DATABASE_URL) is not set. Set it in .env.");
  }

  const pool = await createPgPool("ai-service", connectionString);

  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = getRedisClient(redisUrl);

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    console.error("[ai-service] ANTHROPIC_API_KEY is not set. Set it in .env.");
  }
  const anthropicClient = new Anthropic({ apiKey: anthropicApiKey });

  const chatSessionRepo = new PgChatSessionRepository(pool);
  const chatMessageRepo = new PgChatMessageRepository(pool);
  const tutorStreamer = new ClaudeTutorStreamer(anthropicClient);
  const summaryGenerator = new ClaudeChatSummaryGenerator(anthropicClient);
  const streamPublisher = new RedisChatStreamPublisher(redis);

  const createChatSessionAction = new CreateChatSessionAction(chatSessionRepo);
  const sendChatMessageAction = new SendChatMessageAction(
    chatSessionRepo,
    chatMessageRepo,
    tutorStreamer,
    streamPublisher
  );
  const progressEventPublisher = new RedisProgressEventPublisher(redis);
  const closeChatSessionAction = new CloseChatSessionAction(
    chatSessionRepo,
    chatMessageRepo,
    summaryGenerator,
    progressEventPublisher
  );

  const listChatSessionsAction = new ListChatSessionsAction(chatSessionRepo);
  const listChatMessagesAction = new ListChatMessagesAction(chatSessionRepo, chatMessageRepo);

  const chatController = new ChatController(
    createChatSessionAction,
    sendChatMessageAction,
    closeChatSessionAction,
    listChatSessionsAction,
    listChatMessagesAction
  );
  const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const authMiddleware = createAuthMiddleware(jwtSecret);

  const courseContentGenerator = new ClaudeCourseContentGenerator(anthropicClient);
  const generateCourseContentAction = new GenerateCourseContentAction(courseContentGenerator);
  const courseGenController = new CourseGenController(generateCourseContentAction);
  const internalServiceSecret = process.env.INTERNAL_SERVICE_SECRET ?? "dev-internal-secret-change-in-production";
  const internalServiceMiddleware = createInternalServiceMiddleware(internalServiceSecret);

  const courseServiceUrl = process.env.COURSE_SERVICE_URL ?? "http://course-service:3003";
  const courseServiceClient = new CourseServiceClient(courseServiceUrl, internalServiceSecret);
  const quizGenerator = new ClaudeQuizGenerator(anthropicClient);
  const generateQuizAction = new GenerateQuizAction(quizGenerator, courseServiceClient);
  const gradeShortAnswersAction = new GradeShortAnswersAction(quizGenerator);
  const quizController = new QuizController(generateQuizAction, gradeShortAnswersAction);

  const app = new App(chatController, authMiddleware, courseGenController, quizController, internalServiceMiddleware);

  return { app, pool };
}
