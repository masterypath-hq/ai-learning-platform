/** Hardcoded, per-track scripted content for the hero's live demo + placement teaser. Not real AI output. */

export interface ChatExchange {
  question: string;
  /** Inline code spans are wrapped in backticks, e.g. "Use \`nmap\` here." — rendered by TrackChatDemo. */
  answer: string;
}

export interface PlacementQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface TrackScript {
  slug: string;
  title: string;
  chat: [ChatExchange, ChatExchange];
  placement: [PlacementQuestion, PlacementQuestion, PlacementQuestion];
  /** Matches SelfAssessmentLevel in @ai-learning-platform/shared — used to pre-fill real onboarding. */
  resultLevel: "complete_beginner" | "some_exposure" | "intermediate" | "advanced";
  resultModule: string;
}

export const RESULT_LEVEL_LABELS: Record<TrackScript["resultLevel"], string> = {
  complete_beginner: "Beginner",
  some_exposure: "Some exposure",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const HERO_SCRIPTS: TrackScript[] = [
  {
    slug: "cybersecurity",
    title: "Cybersecurity",
    chat: [
      {
        question: "What's the difference between a vulnerability scan and a pentest?",
        answer:
          "A scan checks for known issues automatically — think `nmap` finding open ports. A pentest is a human actively trying to exploit what the scan finds.",
      },
      {
        question: "How would I stop a SQL injection on a login form?",
        answer:
          "Use parameterized queries — never string-concatenate user input into SQL. In Node that's `pool.query('...WHERE id=$1', [id])`.",
      },
    ],
    placement: [
      {
        prompt: "Which HTTP header helps prevent XSS by restricting script sources?",
        options: ["Content-Security-Policy", "X-Powered-By", "Accept-Language", "ETag"],
        correctIndex: 0,
      },
      {
        prompt: "What does the principle of \"least privilege\" mean?",
        options: [
          "Give every user admin access for convenience",
          "Grant only the access needed to do the job",
          "Encrypt all data at rest",
          "Disable all firewalls",
        ],
        correctIndex: 1,
      },
      {
        prompt: "A port scan shows 22, 80, 443 open. Which is SSH?",
        options: ["80", "443", "22", "None of these"],
        correctIndex: 2,
      },
    ],
    resultLevel: "intermediate",
    resultModule: "Module 3: Network Reconnaissance",
  },
  {
    slug: "ai-engineering",
    title: "AI Engineering",
    chat: [
      {
        question: "Why would I use RAG instead of just fine-tuning?",
        answer:
          "RAG keeps your model current without retraining — it retrieves fresh context (like `pgvector` search results) at query time instead of baking facts into weights.",
      },
      {
        question: "What's a system prompt actually for?",
        answer:
          "It sets persistent behavior for the whole conversation — role, tone, constraints — separate from the user's turn-by-turn `messages`.",
      },
    ],
    placement: [
      {
        prompt: "What does \"temperature\" control in an LLM call?",
        options: ["Response length", "Randomness of output", "API latency", "Token cost"],
        correctIndex: 1,
      },
      {
        prompt: "What's the main risk of an unbounded agent tool loop?",
        options: ["Better answers", "Runaway cost / infinite loops", "Faster responses", "More secure output"],
        correctIndex: 1,
      },
      {
        prompt: "Which approach best grounds answers in your own docs?",
        options: ["Higher temperature", "Retrieval-augmented generation", "Longer system prompt emojis", "Ignoring context"],
        correctIndex: 1,
      },
    ],
    resultLevel: "complete_beginner",
    resultModule: "Module 2: Prompting Fundamentals",
  },
  {
    slug: "backend",
    title: "Backend Engineering",
    chat: [
      {
        question: "Why would I use an index on this column?",
        answer:
          "Without one, Postgres scans every row. An index on `user_id` turns that into a fast lookup instead of a full table scan.",
      },
      {
        question: "What's the difference between PUT and PATCH?",
        answer: "`PUT` replaces the whole resource; `PATCH` applies a partial update — only the fields you send.",
      },
    ],
    placement: [
      {
        prompt: "Which HTTP status means \"created\"?",
        options: ["200", "201", "204", "400"],
        correctIndex: 1,
      },
      {
        prompt: "What's a race condition?",
        options: ["A styling bug", "Two operations interfering due to timing", "A slow database query", "A CSS animation"],
        correctIndex: 1,
      },
      {
        prompt: "What keeps a DB write and a cache update consistent?",
        options: ["Ignoring the cache", "A transaction / write-through strategy", "Random retries", "A bigger server"],
        correctIndex: 1,
      },
    ],
    resultLevel: "intermediate",
    resultModule: "Module 3: Data Modeling & Indexing",
  },
  {
    slug: "data-analysis",
    title: "Data Analysis",
    chat: [
      {
        question: "When should I use a median instead of a mean?",
        answer:
          "When outliers would skew the average — median on `income` data is more representative than mean when a few salaries are huge.",
      },
      {
        question: "What's a p-value actually telling me?",
        answer:
          "The probability of seeing results this extreme if there's really no effect — a small `p < 0.05` is evidence against the null hypothesis, not proof.",
      },
    ],
    placement: [
      {
        prompt: "Which chart is best for showing a trend over time?",
        options: ["Pie chart", "Line chart", "Unordered scatter plot", "Word cloud"],
        correctIndex: 1,
      },
      {
        prompt: "What does a correlation of 0.9 tell you?",
        options: ["Causation is proven", "A strong linear relationship, not causation", "No relationship", "The data is invalid"],
        correctIndex: 1,
      },
      {
        prompt: "Which handles missing data most honestly?",
        options: ["Deleting rows silently", "Documenting and choosing an explicit strategy", "Ignoring nulls", "Always filling with 0"],
        correctIndex: 1,
      },
    ],
    resultLevel: "complete_beginner",
    resultModule: "Module 2: Cleaning Real Datasets",
  },
  {
    slug: "frontend",
    title: "Frontend Engineering",
    chat: [
      {
        question: "Why is my useEffect running twice in development?",
        answer:
          "React 18 Strict Mode intentionally double-invokes effects in dev to catch missing cleanup — it won't happen in production builds.",
      },
      {
        question: "When should I reach for useMemo?",
        answer:
          "Only when a calculation is actually expensive and re-running it every render is measurably slow — `useMemo` isn't free, it has its own overhead.",
      },
    ],
    placement: [
      {
        prompt: "What triggers a React re-render?",
        options: ["Only a page reload", "State or props changing", "Only CSS changes", "Nothing automatic"],
        correctIndex: 1,
      },
      {
        prompt: "Which improves accessibility for a custom button built from a div?",
        options: ["Nothing needed", "role=\"button\" + keyboard handlers", "A bigger font only", "A tooltip"],
        correctIndex: 1,
      },
      {
        prompt: "What's the main risk of heavy prop drilling?",
        options: ["Faster renders", "Tightly coupled, hard-to-maintain components", "Smaller bundle size", "Better type safety"],
        correctIndex: 1,
      },
    ],
    resultLevel: "intermediate",
    resultModule: "Module 3: State & Data Fetching",
  },
  {
    slug: "fullstack",
    title: "Full-Stack Engineering",
    chat: [
      {
        question: "Should my API and my frontend share types?",
        answer:
          "Yes if you can — a shared `@myapp/types` package (Zod-inferred) catches breaking changes at compile time instead of in production.",
      },
      {
        question: "Where should business logic live — controller or service?",
        answer:
          "The service layer. Controllers just translate HTTP in/out; the `service` holds the rules so you can test and reuse them outside Express.",
      },
    ],
    placement: [
      {
        prompt: "What's the benefit of a layered architecture (controller / service / repo)?",
        options: ["Fewer files", "Swappable, independently testable pieces", "Always faster runtime", "No need for tests"],
        correctIndex: 1,
      },
      {
        prompt: "Which is a sign you need a database transaction?",
        options: ["Two related writes must both succeed or neither should", "A single read", "Static HTML", "A CSS change"],
        correctIndex: 0,
      },
      {
        prompt: "What does \"idempotent\" mean for an API endpoint?",
        options: ["It's fast", "Calling it repeatedly has the same effect as once", "It requires auth", "It caches responses"],
        correctIndex: 1,
      },
    ],
    resultLevel: "complete_beginner",
    resultModule: "Module 2: Designing Your Schema",
  },
  {
    slug: "data-engineering",
    title: "Data Engineering",
    chat: [
      {
        question: "My dashboard query used to take 200ms, now it takes 8 seconds. What's going on?",
        answer:
          "Almost certainly table growth without a matching strategy — check if the table is partitioned. Querying a year of data by scanning every row instead of pruning to relevant `date` partitions is the classic cause.",
      },
      {
        question: "When would I reach for a data warehouse instead of just querying Postgres?",
        answer:
          "When analytical queries (scanning millions of rows, big aggregations) start competing with your app's transactional traffic — warehouses like `BigQuery` are built for scan-heavy reads, Postgres is built for fast row lookups.",
      },
    ],
    placement: [
      {
        prompt: "What's the main benefit of partitioning a large table by date?",
        options: ["Prettier schema diagrams", "Queries can skip irrelevant partitions entirely", "It compresses the data", "It removes the need for indexes"],
        correctIndex: 1,
      },
      {
        prompt: "In an ETL pipeline, what does the \"transform\" step typically do?",
        options: ["Move raw bytes only", "Clean, reshape, and validate data before loading", "Delete the source data", "Nothing — it's optional"],
        correctIndex: 1,
      },
      {
        prompt: "What's a key difference between batch and streaming processing?",
        options: ["Streaming processes data continuously as it arrives; batch runs on a schedule", "They're the same thing", "Batch is always faster", "Streaming can't handle large volumes"],
        correctIndex: 0,
      },
    ],
    resultLevel: "some_exposure",
    resultModule: "Module 3: Building Pipelines with Airflow",
  },
  {
    slug: "cloud-engineering",
    title: "Cloud Engineering",
    chat: [
      {
        question: "What's the actual difference between an IAM role and an IAM user?",
        answer:
          "A user is a permanent identity with long-lived credentials; a role is temporary and assumed — by a person, a service, or an EC2 instance — which is why AWS pushes roles for anything automated instead of hardcoding user keys.",
      },
      {
        question: "Why would I use Terraform instead of clicking through the AWS console?",
        answer:
          "Console changes aren't reproducible or reviewable. `terraform plan` shows you exactly what will change before it happens, and the config itself is your infrastructure's version-controlled source of truth.",
      },
    ],
    placement: [
      {
        prompt: "What does the AWS \"shared responsibility model\" mean?",
        options: ["AWS secures everything for you", "AWS secures the cloud; you secure what you put in it", "You're responsible for AWS's data centers", "It only applies to EC2"],
        correctIndex: 1,
      },
      {
        prompt: "Which AWS service provides isolated virtual networking?",
        options: ["S3", "IAM", "VPC", "CloudFront"],
        correctIndex: 2,
      },
      {
        prompt: "What's the benefit of a multi-AZ deployment?",
        options: ["Lower cost", "Higher availability if one zone fails", "Faster builds", "Simpler IAM policies"],
        correctIndex: 1,
      },
    ],
    resultLevel: "complete_beginner",
    resultModule: "Module 2: Core AWS Services",
  },
  {
    slug: "devops",
    title: "DevOps",
    chat: [
      {
        question: "My pipeline just went red on the deploy step — where do I even start?",
        answer:
          "Read the failing step's logs first, not the whole run — most CI failures are one specific command. Reproduce that exact command locally (`docker build .` or whatever the step runs) before touching the pipeline config itself.",
      },
      {
        question: "What's the point of a Kubernetes readiness probe?",
        answer:
          "It tells Kubernetes when a pod is actually ready to receive traffic — without one, a pod can get requests routed to it before its app has finished starting up, causing failed requests during every rollout.",
      },
    ],
    placement: [
      {
        prompt: "What does `docker build` actually produce?",
        options: ["A running container", "An image", "A Kubernetes pod", "A CI pipeline"],
        correctIndex: 1,
      },
      {
        prompt: "What's the main purpose of GitOps?",
        options: ["Replace Git entirely", "Use Git as the single source of truth for infrastructure state", "Only track application code", "Automate commit messages"],
        correctIndex: 1,
      },
      {
        prompt: "In SRE, what does an SLO define?",
        options: ["A ticket priority", "A target reliability level for a service", "A deployment schedule", "A team's on-call rotation only"],
        correctIndex: 1,
      },
    ],
    resultLevel: "some_exposure",
    resultModule: "Module 3: Docker & CI/CD Pipelines",
  },
  {
    slug: "mobile-engineering",
    title: "Mobile Engineering",
    chat: [
      {
        question: "Why did my Jetpack Compose screen recompose when nothing visible changed?",
        answer:
          "A `remember`-less value or an unstable parameter is probably being recreated every recomposition — wrap it in `remember { ... }` or hoist the state, since Compose recomposes any function whose inputs it can't prove are stable.",
      },
      {
        question: "Android or iOS — which should I actually learn first?",
        answer:
          "Whichever platform matches the phone in your pocket and the jobs near you — you'll go fully native either way, Kotlin + Jetpack Compose or Swift + SwiftUI, no cross-platform shortcuts.",
      },
    ],
    placement: [
      {
        prompt: "In Jetpack Compose, what does `remember` do?",
        options: ["Deletes state on recomposition", "Persists a value across recompositions", "Only works in XML layouts", "Nothing — it's decorative"],
        correctIndex: 1,
      },
      {
        prompt: "What's SwiftUI's equivalent of a Compose `@Composable` function?",
        options: ["A `View` struct", "A `UIViewController`", "A `.storyboard` file", "A `Protocol`"],
        correctIndex: 0,
      },
      {
        prompt: "Why would a mobile app use an offline-first architecture?",
        options: ["It's required by app stores", "So the app stays usable without a network connection, syncing later", "It makes the UI simpler", "It removes the need for a backend"],
        correctIndex: 1,
      },
    ],
    resultLevel: "complete_beginner",
    resultModule: "Module 2: Building Your First Screens",
  },
];
