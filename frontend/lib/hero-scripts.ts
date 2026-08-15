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
];
