import pg from "pg";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

// Covers every course from db/seeds/courses.js that isn't already seeded by
// onboarding.js (backend) or onboarding-cybersecurity.js (cybersecurity).
const courses = [
  {
    slug: "frontend",
    skills: [
      { name: "HTML & CSS Fundamentals", icon: "🎨", order_index: 0 },
      { name: "JavaScript Fundamentals", icon: "📜", order_index: 1 },
      { name: "React Basics", icon: "⚛️", order_index: 2 },
      { name: "Browser & Performance", icon: "🚀", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "In CSS, an element has `box-sizing: content-box`, `width: 200px`, and `padding: 20px`. What is its actual rendered width?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "240px — padding is added on top of the specified width.",
          b: "200px — padding never affects the box's width.",
          c: "220px — only one side's padding is added.",
          d: "180px — padding is subtracted from the width.",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "HTML & CSS Fundamentals",
      },
      {
        level: "intermediate",
        question: "What does this log, in order, and why?",
        code_snippet: "console.log('a');\nsetTimeout(() => console.log('b'), 0);\nPromise.resolve().then(() => console.log('c'));\nconsole.log('d');",
        code_language: "javascript",
        options: {
          a: "a, d, c, b — sync code runs first, then microtasks (promises), then macrotasks (timers).",
          b: "a, b, c, d — statements just run top to bottom regardless of async.",
          c: "a, d, b, c — timers always run before promises.",
          d: "a, c, d, b — promises run before any synchronous code.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "JavaScript Fundamentals",
      },
      {
        level: "advanced",
        question: "A React list re-renders slowly and items appear to lose local state when the array is reordered. What's the most likely root cause?",
        code_snippet: "items.map((item, index) => <Row key={index} item={item} />)",
        code_language: "javascript",
        options: {
          a: "Using the array index as the `key` — React can't correctly match items across reorders.",
          b: "React doesn't support reordering lists at all.",
          c: "The component needs `useMemo` around the whole list to fix reordering.",
          d: "This is expected behavior and can't be fixed without a rewrite.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "React Basics",
      },
    ],
  },
  {
    slug: "fullstack",
    skills: [
      { name: "JavaScript Fundamentals", icon: "📜", order_index: 0 },
      { name: "REST APIs", icon: "🔗", order_index: 1 },
      { name: "Database Design", icon: "🗄️", order_index: 2 },
      { name: "System Architecture", icon: "🏗️", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "What's the correct HTTP status code for a successful `POST /users` request that created a new resource?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "201 Created",
          b: "200 OK",
          c: "204 No Content",
          d: "302 Found",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "REST APIs",
      },
      {
        level: "intermediate",
        question: "You're designing a `orders` table that references `customers`. A customer can have many orders. What's the correct relational design?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "A `customer_id` foreign key column on the `orders` table.",
          b: "A `customer_ids` array column on the `orders` table.",
          c: "A `customer_id` foreign key column on the `customers` table.",
          d: "A separate join table is required even for a one-to-many relationship.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Database Design",
      },
      {
        level: "advanced",
        question: "A monolithic app's checkout flow slows the whole system down during traffic spikes, even though other features are unaffected. What's the most appropriate architectural fix?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "Extract checkout into its own service so it can be scaled and rate-limited independently.",
          b: "Add more CPU to the single server hosting the monolith.",
          c: "Rewrite the entire monolith in a faster programming language.",
          d: "Disable checkout during peak hours.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "System Architecture",
      },
    ],
  },
  {
    slug: "ai-engineering",
    skills: [
      { name: "Python for AI", icon: "🐍", order_index: 0 },
      { name: "LLM Fundamentals", icon: "🤖", order_index: 1 },
      { name: "Prompt Engineering", icon: "✍️", order_index: 2 },
      { name: "Vector Search & RAG", icon: "🔍", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "What does an LLM's `temperature` parameter control?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "How random or deterministic the model's token choices are.",
          b: "How many tokens the model is allowed to generate.",
          c: "The size of the model's context window.",
          d: "How much the API call costs.",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "LLM Fundamentals",
      },
      {
        level: "intermediate",
        question: "Your prompt asks an LLM to output JSON, but it sometimes wraps the JSON in prose or markdown fences. What's the most reliable fix?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "Use a structured-output / tool-calling feature or a strict schema, rather than relying on instructions alone.",
          b: "Add the word 'please' to the prompt to make the model more compliant.",
          c: "Increase the temperature so the model is more creative with formatting.",
          d: "This can't be fixed reliably — always parse with regex.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Prompt Engineering",
      },
      {
        level: "advanced",
        question: "In a RAG system, retrieved chunks are often irrelevant to the user's question even though the right document exists in the corpus. What's the most likely cause to investigate first?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "Poor chunking strategy or embedding/query mismatch — chunks may be too large, too small, or semantically misaligned with how questions are phrased.",
          b: "The LLM's temperature is set too low.",
          c: "The vector database needs more RAM.",
          d: "RAG systems can't retrieve relevant chunks reliably, so this is expected.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Vector Search & RAG",
      },
    ],
  },
  {
    slug: "data-analysis",
    skills: [
      { name: "Python & Pandas", icon: "🐍", order_index: 0 },
      { name: "SQL Fundamentals", icon: "🗄️", order_index: 1 },
      { name: "Statistics Basics", icon: "📊", order_index: 2 },
      { name: "Data Visualization", icon: "📈", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "What does `df.groupby('category')['sales'].sum()` do in pandas?",
        code_snippet: "df.groupby('category')['sales'].sum()",
        code_language: "python",
        options: {
          a: "Sums the 'sales' column separately for each unique value in 'category'.",
          b: "Sums the entire 'sales' column, ignoring 'category'.",
          c: "Removes duplicate rows based on 'category'.",
          d: "Sorts the dataframe by 'sales' within each category.",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "Python & Pandas",
      },
      {
        level: "intermediate",
        question: "You need every customer row, plus matching order data where it exists, but customers without orders should still appear with NULLs. Which SQL join?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "LEFT JOIN orders ON customers.id = orders.customer_id",
          b: "INNER JOIN orders ON customers.id = orders.customer_id",
          c: "RIGHT JOIN customers ON orders.customer_id = customers.id, dropping unmatched customers",
          d: "CROSS JOIN orders",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "SQL Fundamentals",
      },
      {
        level: "advanced",
        question: "An A/B test shows Variant B has a higher conversion rate than Variant A, but the p-value is 0.31. What should you conclude?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "The difference isn't statistically significant — you can't confidently say B is actually better.",
          b: "Ship Variant B immediately since it has a higher raw conversion rate.",
          c: "A p-value of 0.31 confirms strong statistical significance.",
          d: "P-values don't matter as long as the sample size is large.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Statistics Basics",
      },
    ],
  },
  {
    slug: "data-engineering",
    skills: [
      { name: "SQL & Data Modeling", icon: "🗄️", order_index: 0 },
      { name: "Python for Pipelines", icon: "🐍", order_index: 1 },
      { name: "ETL Fundamentals", icon: "🔄", order_index: 2 },
      { name: "Distributed Systems", icon: "🌐", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "In a star schema, what's the role of a fact table versus a dimension table?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "The fact table stores measurable events (e.g. sales); dimension tables store descriptive attributes (e.g. product, customer) that the facts reference.",
          b: "Fact tables and dimension tables are interchangeable names for the same thing.",
          c: "The dimension table stores events; the fact table stores descriptions.",
          d: "A star schema has no distinction between facts and dimensions.",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "SQL & Data Modeling",
      },
      {
        level: "intermediate",
        question: "A nightly batch pipeline re-runs after a partial failure and starts producing duplicate rows downstream. What property was the pipeline missing?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "Idempotency — reruns should produce the same result without duplicating data.",
          b: "More CPU cores on the worker nodes.",
          c: "A faster programming language.",
          d: "A bigger batch size.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "ETL Fundamentals",
      },
      {
        level: "advanced",
        question: "A streaming pipeline processing events from multiple partitions needs to compute per-user session windows, but events can arrive out of order across partitions. What's the key concept needed to handle this correctly?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "Event-time processing with watermarks, rather than relying on arrival (processing) time.",
          b: "Simply increasing the number of partitions.",
          c: "Switching to batch processing instead of streaming.",
          d: "Out-of-order events can't be handled in streaming systems.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Distributed Systems",
      },
    ],
  },
  {
    slug: "cloud-engineering",
    skills: [
      { name: "Cloud Fundamentals", icon: "☁️", order_index: 0 },
      { name: "Networking Basics", icon: "🌐", order_index: 1 },
      { name: "Infrastructure as Code", icon: "🏗️", order_index: 2 },
      { name: "Security & IAM", icon: "🔐", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "What's the key difference between an EC2/VM instance and a managed object storage service like S3?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "A VM provides compute you manage; object storage stores files/data without you managing servers.",
          b: "They're two names for the same underlying service.",
          c: "Object storage is always more expensive than running your own VM.",
          d: "VMs can only be used for storage, not computation.",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "Cloud Fundamentals",
      },
      {
        level: "intermediate",
        question: "Why is defining infrastructure in Terraform preferred over manually clicking through a cloud console for production environments?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "It's version-controlled, reviewable, and reproducible — reducing drift and untracked manual changes.",
          b: "Terraform is always faster to execute than the console.",
          c: "The console can't create most cloud resources.",
          d: "Terraform removes the need for any cloud permissions.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Infrastructure as Code",
      },
      {
        level: "advanced",
        question: "A service's IAM role has `\"Action\": \"*\", \"Resource\": \"*\"` in production. What's the primary risk and the right fix?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "Violates least privilege — a compromised service could access or modify anything; scope the policy to only the actions/resources it needs.",
          b: "There's no risk as long as the service is behind a VPC.",
          c: "Wildcard permissions are required for services to function correctly.",
          d: "This only matters for services with public internet access.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Security & IAM",
      },
    ],
  },
  {
    slug: "devops",
    skills: [
      { name: "Linux & CLI", icon: "🐧", order_index: 0 },
      { name: "CI/CD Fundamentals", icon: "🔁", order_index: 1 },
      { name: "Containers & Docker", icon: "🐳", order_index: 2 },
      { name: "Kubernetes Basics", icon: "☸️", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "What does `chmod 755 script.sh` do?",
        code_snippet: "chmod 755 script.sh",
        code_language: "bash",
        options: {
          a: "Gives the owner read/write/execute, and everyone else read/execute.",
          b: "Deletes the file if it isn't executable.",
          c: "Makes the file readable only by the owner.",
          d: "Changes the file's owner to root.",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "Linux & CLI",
      },
      {
        level: "intermediate",
        question: "A Docker image built with `FROM node:latest` behaves differently in staging vs. production despite no code changes. What's the most likely cause?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "The `latest` tag is a moving target — each build may pull a different underlying image version.",
          b: "Docker images are non-deterministic by design and this can't be avoided.",
          c: "This only happens with ARM-based machines.",
          d: "Docker doesn't support Node.js reliably.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Containers & Docker",
      },
      {
        level: "advanced",
        question: "A Kubernetes Deployment's pods keep getting OOMKilled under load even though the node has free memory. What should you check first?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "The pod's memory `limits` in its resource spec — the container is likely being capped below what it needs.",
          b: "The number of replicas, which is unrelated to per-pod memory.",
          c: "The cluster's DNS configuration.",
          d: "OOMKilled only happens due to node hardware failure.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Kubernetes Basics",
      },
    ],
  },
  {
    slug: "mobile-android",
    skills: [
      { name: "Kotlin Basics", icon: "🤖", order_index: 0 },
      { name: "Android Fundamentals", icon: "📱", order_index: 1 },
      { name: "Jetpack Compose", icon: "🎨", order_index: 2 },
      { name: "App Architecture", icon: "🏗️", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "In Kotlin, what's the difference between `val` and `var`?",
        code_snippet: "val x = 5\nvar y = 10",
        code_language: "kotlin",
        options: {
          a: "`val` is a read-only (immutable) reference; `var` can be reassigned.",
          b: "They're interchangeable keywords with no functional difference.",
          c: "`val` is for numbers only, `var` is for strings only.",
          d: "`var` is deprecated in modern Kotlin.",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "Kotlin Basics",
      },
      {
        level: "intermediate",
        question: "An Activity loses its user-entered form data when the device is rotated. What's the standard fix?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "Persist the relevant state in `onSaveInstanceState` / a `ViewModel` that survives configuration changes.",
          b: "Disable screen rotation entirely for the app.",
          c: "This is unavoidable — rotation always clears form state.",
          d: "Store the data in a global static variable.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Android Fundamentals",
      },
      {
        level: "advanced",
        question: "A Jetpack Compose screen re-renders the entire list every time one item's state changes, hurting performance. What's the most likely cause?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "State is hoisted too high or lacks stable keys, so recomposition isn't scoped to just the changed item.",
          b: "Compose always re-renders the entire screen on any state change — this can't be avoided.",
          c: "The app needs to switch back to the XML View system.",
          d: "This only happens on emulators, not real devices.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "Jetpack Compose",
      },
    ],
  },
  {
    slug: "mobile-ios",
    skills: [
      { name: "Swift Basics", icon: "🍎", order_index: 0 },
      { name: "iOS Fundamentals", icon: "📱", order_index: 1 },
      { name: "SwiftUI", icon: "🎨", order_index: 2 },
      { name: "App Architecture", icon: "🏗️", order_index: 3 },
    ],
    placementQuestions: [
      {
        level: "foundation",
        question: "In Swift, what does declaring a variable as `let name = \"Tolu\"` versus `var name = \"Tolu\"` mean?",
        code_snippet: "let a = \"Tolu\"\nvar b = \"Tolu\"",
        code_language: "swift",
        options: {
          a: "`let` creates a constant that can't be reassigned; `var` creates a mutable variable.",
          b: "Both are identical — `let` is just older Swift syntax.",
          c: "`let` is only valid for optionals.",
          d: "`var` can only be used inside functions.",
        },
        correct_option: "a",
        phase_if_correct: "intermediate",
        phase_if_wrong: "foundation",
        skillName: "Swift Basics",
      },
      {
        level: "intermediate",
        question: "Two objects hold strong references to each other (a parent and child), and neither is ever deallocated even after the user leaves the screen. What's the issue and fix?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "A retain cycle under ARC — one of the references (typically the child's back-reference to the parent) should be declared `weak` or `unowned`.",
          b: "iOS doesn't have automatic memory management, so this is expected.",
          c: "This can only be fixed by restarting the app.",
          d: "Strong references are always automatically broken when a view disappears.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "iOS Fundamentals",
      },
      {
        level: "advanced",
        question: "A SwiftUI view re-renders unnecessarily whenever any property on a large `@ObservedObject` changes, even properties the view doesn't use. What's the most appropriate fix?",
        code_snippet: null,
        code_language: null,
        options: {
          a: "Split the object into smaller, focused observable pieces (or use `@Published` more granularly) so views only observe what they actually read.",
          b: "SwiftUI can't be optimized for this — switch back to UIKit.",
          c: "Wrap the entire view in `.equatable()` with no other changes.",
          d: "Increase the app's minimum deployment target.",
        },
        correct_option: "a",
        phase_if_correct: "advanced",
        phase_if_wrong: "intermediate",
        skillName: "SwiftUI",
      },
    ],
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
      const courseResult = await pool.query("SELECT id FROM courses WHERE slug = $1", [course.slug]);
      if (courseResult.rows.length === 0) {
        console.error(`Course "${course.slug}" not found. Run "npm run seed:courses" first. Skipping.`);
        continue;
      }
      const courseId = courseResult.rows[0].id;

      const skillIdByName = {};
      for (const skill of course.skills) {
        const result = await pool.query(
          `INSERT INTO skills (course_id, name, icon, order_index)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (course_id, name) DO UPDATE SET icon = EXCLUDED.icon, order_index = EXCLUDED.order_index
           RETURNING id, name`,
          [courseId, skill.name, skill.icon, skill.order_index]
        );
        skillIdByName[result.rows[0].name] = result.rows[0].id;
      }

      for (const placementQuestion of course.placementQuestions) {
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
      }

      console.log(`✓ ${course.slug}: ${course.skills.length} skills, ${course.placementQuestions.length} placement questions`);
    }

    console.log("\nAll onboarding data seeded.");
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
