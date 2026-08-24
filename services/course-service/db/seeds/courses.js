import pg from "pg";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

// Slug/title/estWeeks here must stay in sync with packages/shared/src/tracks.ts (TRACKS) —
// that file is the source of truth for track copy/curriculum; this script owns the catalog
// row's DB-only fields (description, primary_language) that TRACKS doesn't carry.
const courses = [
  {
    slug: "backend",
    title: "Backend Engineering",
    description: "Master server-side development, APIs, databases, and distributed systems.",
    primary_language: "Node.js / Python",
    duration_weeks: 40,
  },
  {
    slug: "frontend",
    title: "Frontend Engineering",
    description: "Build modern, responsive user interfaces with the latest web technologies.",
    primary_language: "React / TypeScript",
    duration_weeks: 32,
  },
  {
    slug: "fullstack",
    title: "Full-Stack Engineering",
    description: "End-to-end development from database design to polished user interfaces.",
    primary_language: "Node.js / React",
    duration_weeks: 48,
  },
  {
    slug: "ai-engineering",
    title: "AI Engineering",
    description: "Design and build production AI systems, LLM integrations, and intelligent agents.",
    primary_language: "Python / TypeScript",
    duration_weeks: 36,
  },
  {
    slug: "data-analysis",
    title: "Data Analysis",
    description: "Transform raw data into insights using modern analytics tools and techniques.",
    primary_language: "Python / SQL",
    duration_weeks: 28,
  },
  {
    slug: "cybersecurity",
    title: "Cybersecurity",
    description: "Protect systems and networks — offensive and defensive security fundamentals.",
    primary_language: "Python / Bash",
    duration_weeks: 36,
  },
  {
    slug: "data-engineering",
    title: "Data Engineering",
    description: "Design and run production data platforms — pipelines, streaming, warehouses, and governance.",
    primary_language: "Python / SQL",
    duration_weeks: 40,
  },
  {
    slug: "cloud-engineering",
    title: "Cloud Engineering",
    description: "Design, automate, and secure cloud infrastructure at a certification-level depth.",
    primary_language: "Terraform / AWS",
    duration_weeks: 36,
  },
  {
    slug: "devops",
    title: "DevOps",
    description: "Run CI/CD, containers, and Kubernetes in production, with real SRE practice.",
    primary_language: "Docker / Kubernetes",
    duration_weeks: 36,
  },
  {
    slug: "mobile-android",
    title: "Mobile Engineering — Android",
    description: "Ship a complete native Android app — Kotlin, Jetpack Compose, and its own backend.",
    primary_language: "Kotlin",
    duration_weeks: 36,
  },
  {
    slug: "mobile-ios",
    title: "Mobile Engineering — iOS",
    description: "Ship a complete native iOS app — Swift, SwiftUI, and its own backend.",
    primary_language: "Swift",
    duration_weeks: 36,
  },
];

const CATEGORY_NAME = "Programming & AI";
const CATEGORY_SLUG = "programming-ai";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : false,
  });

  try {
    // Schema note: courses.category (TEXT) was replaced by categories + courses.category_id
    // (see migration 1749300000000_categories.js) — this script targets the current FK shape.
    const categoryResult = await pool.query(
      `INSERT INTO categories (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [CATEGORY_NAME, CATEGORY_SLUG]
    );
    const categoryId = categoryResult.rows[0].id;

    for (const course of courses) {
      await pool.query(
        `INSERT INTO courses (id, slug, title, description, primary_language, duration_weeks, category_id, is_published)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           primary_language = EXCLUDED.primary_language,
           duration_weeks = EXCLUDED.duration_weeks,
           category_id = EXCLUDED.category_id,
           is_published = EXCLUDED.is_published,
           updated_at = NOW()`,
        [course.slug, course.title, course.description, course.primary_language, course.duration_weeks, categoryId]
      );
      console.log(`✓ ${course.title}`);
    }
    console.log("\nAll courses seeded.");
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
