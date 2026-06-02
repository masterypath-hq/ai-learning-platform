import dns from "node:dns";
import pg from "pg";
import { PgCourseRepository } from "./infrastructure/persistence/PgCourseRepository.js";
import { PgModuleRepository } from "./infrastructure/persistence/PgModuleRepository.js";
import { PgLessonRepository } from "./infrastructure/persistence/PgLessonRepository.js";
import { ClaudeContentGenerator } from "./infrastructure/ai/ClaudeContentGenerator.js";
import { InMemoryEventPublisher } from "./infrastructure/events/InMemoryEventPublisher.js";
import { GenerateCourseAction } from "./application/actions/GenerateCourseAction.js";
import { GetCourseAction } from "./application/actions/GetCourseAction.js";
import { ListUserCoursesAction } from "./application/actions/ListUserCoursesAction.js";
import { CourseService } from "./application/services/CourseService.js";
import { CourseController } from "./interfaces/http/controllers/CourseController.js";
import { createAuthMiddleware } from "./interfaces/http/middleware/authMiddleware.js";
import { App } from "./interfaces/http/app.js";

const DEFAULT_DATABASE_URL = "postgresql://course:course@localhost:5432/course";

function normalizeConnectionString(value: string): string {
  let s = value.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

/**
 * Parse postgresql:// or postgres:// URL without using URL() so passwords
 * containing @, :, #, etc. work (no URL-encoding required).
 */
function parseConnectionString(connectionString: string): pg.PoolConfig {
  const withoutProtocol = connectionString.replace(/^\s*postgres(ql)?:\/\//i, "").trim();
  const atIndex = withoutProtocol.lastIndexOf("@");
  if (atIndex === -1) {
    return { connectionString };
  }
  const userPass = withoutProtocol.slice(0, atIndex);
  const hostPortDb = withoutProtocol.slice(atIndex + 1);
  const colonIndex = userPass.indexOf(":");
  const user = colonIndex === -1 ? userPass : userPass.slice(0, colonIndex);
  const password = colonIndex === -1 ? undefined : userPass.slice(colonIndex + 1);
  const slashIndex = hostPortDb.indexOf("/");
  const database = slashIndex === -1 ? "postgres" : hostPortDb.slice(slashIndex + 1).replace(/\?.*$/, "");
  const hostPort = slashIndex === -1 ? hostPortDb : hostPortDb.slice(0, slashIndex);
  const lastColon = hostPort.lastIndexOf(":");
  const host = lastColon === -1 ? hostPort : hostPort.slice(0, lastColon);
  const port = lastColon === -1 ? 5432 : parseInt(hostPort.slice(lastColon + 1), 10) || 5432;
  const ssl =
    host !== "localhost" && !host.startsWith("127.")
      ? { rejectUnauthorized: false, servername: host }
      : false;
  return { user, password, host, port, database, ssl };
}

/** Use IPv4 when available. Skip for Supabase pooler — use hostname as-is for tenant routing. */
async function resolveHostToIPv4(host: string): Promise<string> {
  if (host === "localhost" || host.startsWith("127.")) return host;
  if (host.includes("pooler.supabase.com")) return host;
  try {
    const addresses = await dns.promises.resolve4(host);
    return addresses[0] ?? host;
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : "";
    if (code === "ENODATA" || code === "ENOTFOUND") {
      console.warn(
        `[course-service] Host "${host}" has no IPv4 record. Consider using Supabase's pooler connection string.`
      );
      return host;
    }
    throw err;
  }
}

export async function createCompositionRoot() {
  // Database
  const raw = process.env.COURSE_DATABASE_URL ?? process.env.DATABASE_URL;
  const connectionString =
    raw && raw.trim() !== ""
      ? normalizeConnectionString(raw)
      : DEFAULT_DATABASE_URL;

  if (!raw || raw.trim() === "") {
    console.error(
      "[course-service] COURSE_DATABASE_URL (or DATABASE_URL) is not set. Set it in .env."
    );
  }

  const isPooler = connectionString.includes("pooler.supabase.com");
  let pool: pg.Pool;

  if (isPooler) {
    const poolConfig = parseConnectionString(connectionString.replace(/\?.*$/, ""));
    console.log(`[course-service] Using Supabase pooler (parsed connection; supports @ in password)`);
    pool = new pg.Pool({
      user: poolConfig.user,
      password: poolConfig.password,
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      ssl: { rejectUnauthorized: false, servername: poolConfig.host as string },
    });
  } else {
    const poolConfig = parseConnectionString(connectionString);
    if (poolConfig.host) {
      poolConfig.host = await resolveHostToIPv4(poolConfig.host);
    }
    pool = new pg.Pool(poolConfig);
  }

  // Repositories
  const courseRepo = new PgCourseRepository(pool);
  const moduleRepo = new PgModuleRepository(pool);
  const lessonRepo = new PgLessonRepository(pool);

  // AI content generator
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    console.error("[course-service] ANTHROPIC_API_KEY is not set. Course generation will fail.");
  }
  const aiGenerator = new ClaudeContentGenerator(anthropicApiKey ?? "");

  // Events
  const eventPublisher = new InMemoryEventPublisher();

  // Actions
  const generateCourseAction = new GenerateCourseAction(
    courseRepo,
    moduleRepo,
    lessonRepo,
    aiGenerator,
    eventPublisher
  );
  const getCourseAction = new GetCourseAction(courseRepo, moduleRepo, lessonRepo);
  const listUserCoursesAction = new ListUserCoursesAction(courseRepo);

  // Service
  const courseService = new CourseService(
    generateCourseAction,
    getCourseAction,
    listUserCoursesAction,
    courseRepo
  );

  // HTTP
  const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
  const authMiddleware = createAuthMiddleware(jwtSecret);
  const courseController = new CourseController(courseService);
  const app = new App(courseController, authMiddleware);

  return { app, pool };
}
