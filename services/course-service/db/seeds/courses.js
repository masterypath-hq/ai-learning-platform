import pg from "pg";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

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
];

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
    for (const course of courses) {
      await pool.query(
        `INSERT INTO courses (id, slug, title, description, primary_language, duration_weeks, is_published)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           primary_language = EXCLUDED.primary_language,
           duration_weeks = EXCLUDED.duration_weeks,
           is_published = EXCLUDED.is_published,
           updated_at = NOW()`,
        [course.slug, course.title, course.description, course.primary_language, course.duration_weeks]
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
