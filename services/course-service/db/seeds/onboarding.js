import pg from "pg";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

const COURSE_SLUG = "backend";

const skills = [
  { name: "Python Basics", icon: "🐍", order_index: 0 },
  { name: "RESTful APIs", icon: "🔗", order_index: 1 },
  { name: "PostgreSQL Fundamentals", icon: "🗄️", order_index: 2 },
  { name: "Data Encryption", icon: "🔒", order_index: 3 },
];

const placementQuestion = {
  level: "foundation",
  question: "What does this print, and what is a potential structural issue with this code?",
  code_snippet: "def greet(name):\n    return 'Hello' + name\n\nprint(greet('Tolu'))",
  code_language: "python",
  options: {
    a: "It prints 'HelloTolu'. The problem is the lack of a space in the string concatenation.",
    b: "It throws a TypeError because 'name' is not defined as a string globally.",
    c: "It prints 'Hello Tolu'. The issue is that return should be print within the function.",
    d: "It prints 'HelloTolu'. The code is perfectly optimized for production use as is.",
  },
  correct_option: "a",
  phase_if_correct: "intermediate",
  phase_if_wrong: "foundation",
  skillName: "Python Basics",
};

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
    const courseResult = await pool.query("SELECT id FROM courses WHERE slug = $1", [COURSE_SLUG]);
    if (courseResult.rows.length === 0) {
      console.error(`Course "${COURSE_SLUG}" not found. Run "npm run seed:courses" first.`);
      process.exit(1);
    }
    const courseId = courseResult.rows[0].id;

    const skillIdByName = {};
    for (const skill of skills) {
      const result = await pool.query(
        `INSERT INTO skills (course_id, name, icon, order_index)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (course_id, name) DO UPDATE SET icon = EXCLUDED.icon, order_index = EXCLUDED.order_index
         RETURNING id, name`,
        [courseId, skill.name, skill.icon, skill.order_index]
      );
      skillIdByName[result.rows[0].name] = result.rows[0].id;
      console.log(`✓ skill: ${skill.name}`);
    }

    await pool.query(
      `INSERT INTO placement_questions
         (course_id, level, question, options, correct_option, phase_if_correct, phase_if_wrong, code_snippet, code_language, skill_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (course_id, level) DO UPDATE SET
         question = EXCLUDED.question,
         options = EXCLUDED.options,
         correct_option = EXCLUDED.correct_option,
         phase_if_correct = EXCLUDED.phase_if_correct,
         phase_if_wrong = EXCLUDED.phase_if_wrong,
         code_snippet = EXCLUDED.code_snippet,
         code_language = EXCLUDED.code_language,
         skill_id = EXCLUDED.skill_id,
         updated_at = NOW()`,
      [
        courseId,
        placementQuestion.level,
        placementQuestion.question,
        JSON.stringify(placementQuestion.options),
        placementQuestion.correct_option,
        placementQuestion.phase_if_correct,
        placementQuestion.phase_if_wrong,
        placementQuestion.code_snippet,
        placementQuestion.code_language,
        skillIdByName[placementQuestion.skillName],
      ]
    );
    console.log(`✓ placement question: ${placementQuestion.level}`);

    console.log("\nOnboarding data seeded.");
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
