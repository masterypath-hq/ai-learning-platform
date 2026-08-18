import { createInternalServiceMiddleware } from "@ai-learning-platform/shared";
import { createPgPool } from "@ai-learning-platform/shared/pg-pool";
import { getRedisClient } from "./lib/redis.js";
import { RedisProgressEventPublisher } from "./infrastructure/redis/RedisProgressEventPublisher.js";
import { MarkLessonViewedAction } from "./application/actions/MarkLessonViewedAction.js";
import { PgCourseRepository } from "./infrastructure/persistence/PgCourseRepository.js";
import { PgModuleRepository } from "./infrastructure/persistence/PgModuleRepository.js";
import { PgLessonRepository } from "./infrastructure/persistence/PgLessonRepository.js";
import { PgEnrollmentRepository } from "./infrastructure/persistence/PgEnrollmentRepository.js";
import { PgPlacementQuestionRepository } from "./infrastructure/persistence/PgPlacementQuestionRepository.js";
import { PgCategoryRepository } from "./infrastructure/persistence/PgCategoryRepository.js";
import { PgSkillRepository } from "./infrastructure/persistence/PgSkillRepository.js";
import { PgUserSkillConfidenceRepository } from "./infrastructure/persistence/PgUserSkillConfidenceRepository.js";
import { PgPlacementAnswerRepository } from "./infrastructure/persistence/PgPlacementAnswerRepository.js";
import { PgCourseContentWriter } from "./infrastructure/persistence/PgCourseContentWriter.js";
import { PgCourseGenerationWriter } from "./infrastructure/persistence/PgCourseGenerationWriter.js";
import { GetCourseAction } from "./application/actions/GetCourseAction.js";
import { CourseService } from "./application/services/CourseService.js";
import { CourseController } from "./interfaces/http/controllers/CourseController.js";
import { createAuthMiddleware } from "./interfaces/http/middleware/authMiddleware.js";
import { App } from "./interfaces/http/app.js";

const DEFAULT_DATABASE_URL = "postgresql://course:course@localhost:5432/course";

export async function createCompositionRoot() {
  const raw = process.env.COURSE_DATABASE_URL ?? process.env.DATABASE_URL;
  const connectionString = raw && raw.trim() !== "" ? raw : DEFAULT_DATABASE_URL;

  if (!raw || raw.trim() === "") {
    console.error(
      "[course-service] COURSE_DATABASE_URL (or DATABASE_URL) is not set. Set it in .env."
    );
  }

  const pool = await createPgPool("course-service", connectionString);

  const courseRepo = new PgCourseRepository(pool);
  const moduleRepo = new PgModuleRepository(pool);
  const lessonRepo = new PgLessonRepository(pool);
  const enrollmentRepo = new PgEnrollmentRepository(pool);
  const placementQuestionRepo = new PgPlacementQuestionRepository(pool);
  const categoryRepo = new PgCategoryRepository(pool);
  const skillRepo = new PgSkillRepository(pool);
  const userSkillConfidenceRepo = new PgUserSkillConfidenceRepository(pool);
  const placementAnswerRepo = new PgPlacementAnswerRepository(pool);
  const courseContentWriter = new PgCourseContentWriter(pool);
  const courseGenerationWriter = new PgCourseGenerationWriter(pool);

  const getCourseAction = new GetCourseAction(courseRepo, moduleRepo, lessonRepo);
  const courseService = new CourseService(
    getCourseAction,
    courseRepo,
    enrollmentRepo,
    moduleRepo,
    lessonRepo,
    placementQuestionRepo,
    skillRepo,
    userSkillConfidenceRepo,
    placementAnswerRepo,
    courseContentWriter,
    courseGenerationWriter
  );
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = getRedisClient(redisUrl);
  const progressEventPublisher = new RedisProgressEventPublisher(redis);
  const markLessonViewedAction = new MarkLessonViewedAction(lessonRepo, moduleRepo, progressEventPublisher);

  const courseController = new CourseController(courseService, markLessonViewedAction);
  const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const authMiddleware = createAuthMiddleware(jwtSecret);
  const internalServiceSecret = process.env.INTERNAL_SERVICE_SECRET ?? "dev-internal-secret-change-in-production";
  const internalServiceMiddleware = createInternalServiceMiddleware(internalServiceSecret);
  const app = new App(courseController, authMiddleware, internalServiceMiddleware);

  return { app, pool, categoryRepo, skillRepo, userSkillConfidenceRepo, placementAnswerRepo };
}
