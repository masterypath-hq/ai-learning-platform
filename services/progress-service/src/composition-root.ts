import { createPgPool } from "@ai-learning-platform/shared";
import { getRedisClient } from "./lib/redis.js";
import { PgProgressRecordRepository } from "./infrastructure/persistence/PgProgressRecordRepository.js";
import { PgStreakRepository } from "./infrastructure/persistence/PgStreakRepository.js";
import { CourseServiceClient } from "./infrastructure/http/CourseServiceClient.js";
import { AssessmentServiceClient } from "./infrastructure/http/AssessmentServiceClient.js";
import { ProgressEventSubscriber } from "./infrastructure/redis/ProgressEventSubscriber.js";
import { RecordProgressEventAction } from "./application/actions/RecordProgressEventAction.js";
import { GetDashboardAction } from "./application/actions/GetDashboardAction.js";
import { GetCourseProgressAction } from "./application/actions/GetCourseProgressAction.js";
import { createAuthMiddleware } from "./interfaces/http/middleware/authMiddleware.js";
import { ProgressController } from "./interfaces/http/controllers/ProgressController.js";
import { App } from "./interfaces/http/app.js";

const DEFAULT_DATABASE_URL = "postgresql://progress:progress@localhost:5432/progress";

export async function createCompositionRoot() {
  const raw = process.env.PROGRESS_DATABASE_URL ?? process.env.DATABASE_URL;
  const connectionString = raw && raw.trim() !== "" ? raw : DEFAULT_DATABASE_URL;

  if (!raw || raw.trim() === "") {
    console.error("[progress-service] PROGRESS_DATABASE_URL (or DATABASE_URL) is not set. Set it in .env.");
  }

  const pool = await createPgPool("progress-service", connectionString);

  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = getRedisClient(redisUrl);
  // A connection that issues SUBSCRIBE can't run other commands, so the subscriber gets its own.
  const subscriberRedis = redis.duplicate();

  const progressRecordRepo = new PgProgressRecordRepository(pool);
  const streakRepo = new PgStreakRepository(pool);

  const internalServiceSecret = process.env.INTERNAL_SERVICE_SECRET ?? "dev-internal-secret-change-in-production";
  const courseServiceUrl = process.env.COURSE_SERVICE_URL ?? "http://course-service:3003";
  const assessmentServiceUrl = process.env.ASSESSMENT_SERVICE_URL ?? "http://assessment-service:5005";
  const courseServiceClient = new CourseServiceClient(courseServiceUrl, internalServiceSecret);
  const assessmentServiceClient = new AssessmentServiceClient(assessmentServiceUrl, internalServiceSecret);

  const recordProgressEventAction = new RecordProgressEventAction(progressRecordRepo, streakRepo);
  const getDashboardAction = new GetDashboardAction(
    progressRecordRepo,
    streakRepo,
    courseServiceClient,
    assessmentServiceClient
  );
  const getCourseProgressAction = new GetCourseProgressAction(progressRecordRepo, courseServiceClient);

  const progressController = new ProgressController(getDashboardAction, getCourseProgressAction);
  const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const authMiddleware = createAuthMiddleware(jwtSecret);

  const app = new App(progressController, authMiddleware);

  const subscriber = new ProgressEventSubscriber(subscriberRedis, recordProgressEventAction);
  await subscriber.start();

  return { app, pool, subscriberRedis };
}
