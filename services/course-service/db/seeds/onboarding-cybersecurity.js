import pg from "pg";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

const COURSE_SLUG = "cybersecurity";

const skills = [
  { name: "Networking Fundamentals", icon: "🌐", order_index: 0 },
  { name: "Linux & Command Line", icon: "🐧", order_index: 1 },
  { name: "Web App Security", icon: "🛡️", order_index: 2 },
  { name: "Cryptography Basics", icon: "🔐", order_index: 3 },
];

const placementQuestions = [
  {
    level: "foundation",
    question: "A website uses `SELECT * FROM users WHERE username = '<input>'` directly with unsanitized user input. What kind of vulnerability is this?",
    code_snippet: null,
    code_language: null,
    options: {
      a: "SQL injection — an attacker can inject SQL to bypass auth or read data.",
      b: "Cross-site scripting — the browser will execute injected JavaScript.",
      c: "A denial-of-service vulnerability from the unbounded query.",
      d: "This is safe as long as HTTPS is used.",
    },
    correct_option: "a",
    phase_if_correct: "intermediate",
    phase_if_wrong: "foundation",
    skillName: "Web App Security",
  },
  {
    level: "intermediate",
    question:
      "You run `nmap -sV target.com` and see port 22 open running an outdated OpenSSH version. What's the most appropriate next step in an authorized penetration test?",
    code_snippet: null,
    code_language: null,
    options: {
      a: "Check the version against known CVEs and look for a matching public exploit or misconfiguration.",
      b: "Immediately attempt a brute-force login against the SSH service.",
      c: "Ignore it — port 22 being open is never a finding worth reporting.",
      d: "Report it as a critical vulnerability without further investigation.",
    },
    correct_option: "a",
    phase_if_correct: "advanced",
    phase_if_wrong: "intermediate",
    skillName: "Networking Fundamentals",
  },
  {
    level: "advanced",
    question:
      "During an engagement, you gain a low-privilege shell on a Linux host. Which technique is the most reliable first step toward privilege escalation?",
    code_snippet: "find / -perm -4000 -type f 2>/dev/null",
    code_language: "bash",
    options: {
      a: "Enumerate SUID binaries, sudo permissions, and kernel version for known local-privesc paths.",
      b: "Immediately attempt to crack /etc/shadow hashes offline.",
      c: "Reboot the machine to see if it grants a root shell on startup.",
      d: "Install a rootkit to guarantee persistence before doing anything else.",
    },
    correct_option: "a",
    phase_if_correct: "advanced",
    phase_if_wrong: "intermediate",
    skillName: "Linux & Command Line",
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

    for (const placementQuestion of placementQuestions) {
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
    }

    console.log("\nCybersecurity onboarding data seeded.");
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
