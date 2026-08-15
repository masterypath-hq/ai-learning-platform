/**
 * Stage 4: generates the full module → lesson tree for catalog courses and
 * persists it, using ai-service's generation endpoint + course-service's
 * content endpoint directly (no gateway/auth — internal-secret protected).
 *
 * Usage:
 *   npm run generate:course-content                  # all published courses
 *   npm run generate:course-content -- backend        # a single track slug
 *
 * Requires (root .env): INTERNAL_SERVICE_SECRET, ANTHROPIC_API_KEY (set on
 * ai-service). Run `npm run seed:courses` first so course rows exist.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:5002";
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL ?? "http://localhost:3003";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

type TrackCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
};

async function main() {
  if (!INTERNAL_SERVICE_SECRET) {
    console.error("INTERNAL_SERVICE_SECRET is not set in .env");
    process.exit(1);
  }

  const trackFilter = process.argv[2];

  const listRes = await fetch(`${COURSE_SERVICE_URL}/api/v1/courses`);
  if (!listRes.ok) {
    console.error(`Failed to list courses: ${listRes.status} ${await listRes.text()}`);
    process.exit(1);
  }
  const { courses }: { courses: TrackCourse[] } = await listRes.json();

  const targets = trackFilter ? courses.filter((c) => c.slug === trackFilter) : courses;
  if (targets.length === 0) {
    console.error(trackFilter ? `No published course found with slug "${trackFilter}"` : "No published courses found. Run npm run seed:courses first.");
    process.exit(1);
  }

  const failures: string[] = [];

  for (const course of targets) {
    console.log(`\n→ Generating content for "${course.title}" (${course.slug})...`);
    try {
      const genRes = await fetch(`${AI_SERVICE_URL}/internal/courses/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SERVICE_SECRET },
        body: JSON.stringify({
          trackSlug: course.slug,
          title: course.title,
          description: course.description ?? "",
        }),
      });
      const genBody = await genRes.json();
      if (!genRes.ok || !genBody.success) {
        throw new Error(`generation failed: ${genRes.status} ${JSON.stringify(genBody.error)}`);
      }

      const persistRes = await fetch(`${COURSE_SERVICE_URL}/api/v1/courses/${course.id}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SERVICE_SECRET },
        body: JSON.stringify(genBody.data),
      });
      const persistBody = await persistRes.json();
      if (!persistRes.ok) {
        throw new Error(`persist failed: ${persistRes.status} ${JSON.stringify(persistBody.error)}`);
      }

      console.log(`  ✓ ${genBody.data.modules.length} modules persisted.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${course.slug}: ${message}`);
      failures.push(course.slug);
    }
  }

  console.log(`\nDone. ${targets.length - failures.length}/${targets.length} course(s) generated.`);
  if (failures.length > 0) {
    console.error(`Failed: ${failures.join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
