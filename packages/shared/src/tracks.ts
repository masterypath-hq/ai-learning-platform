/**
 * TRACKS — the single source of truth for track metadata (Data Eng / Cloud / DevOps /
 * Mobile expansion). Consumed by: landing cards, hero demo switcher, onboarding track
 * picker, auth photo carousel, course-gen prompt grounding, and the course-service seed
 * script.
 *
 * This is content/copy metadata only — it does NOT carry DB course ids. Actual
 * enrollment still goes through `/api/tracks` (course-service, DB-driven), joined to
 * these entries by `slug`. Keeping the DB as the enrollment source of truth and this
 * file as the content source of truth avoids rearchitecting enrollment for a config file.
 */

export interface MasteryPathOutline {
  beginner: string;
  intermediate: string;
  advanced: string;
  mastery: string;
}

export type TrackCategory = "Software Engineering" | "Data, Cloud & Ops" | "Mobile Engineering";

export interface TrackDefinition {
  id: string;
  name: string;
  /** Icon key resolved to a lucide-react component by frontend/lib/track-metadata.ts. */
  icon: string;
  estWeeks: number;
  category: TrackCategory;
  outcomeLine: string;
  bullets: [string, string, string];
  /**
   * Curriculum outline the course generator grounds module generation in
   * (see services/ai-service/src/application/prompts/courseGen.ts). Only set for
   * tracks added after the original 6 — those 6 keep generating without this
   * grounding block so their prompt behavior is unchanged.
   */
  masteryPath?: MasteryPathOutline;
  status: "live";
  /** Tracks sharing a displayGroup collapse into one card via groupTracksForDisplay. */
  displayGroup?: string;
}

export const TRACKS: TrackDefinition[] = [
  // ----- Original 6 (Software Engineering) -----
  {
    id: "fullstack",
    name: "Full-Stack Engineering",
    icon: "layers",
    estWeeks: 48,
    category: "Software Engineering",
    outcomeLine: "By the end, you'll ship and deploy a complete product on your own — front to back, no hand-holding.",
    bullets: ["Design schemas & APIs", "Ship a complete app front-to-back", "Deploy and own the full stack"],
    status: "live",
  },
  {
    id: "backend",
    name: "Backend Engineering",
    icon: "server",
    estWeeks: 40,
    category: "Software Engineering",
    outcomeLine: "By the end, you'll design and defend APIs that hold up under real traffic and real data.",
    bullets: ["Build production-grade APIs", "Model and query real databases", "Reason about distributed systems"],
    status: "live",
  },
  {
    id: "frontend",
    name: "Frontend Engineering",
    icon: "monitor-smartphone",
    estWeeks: 32,
    category: "Software Engineering",
    outcomeLine: "By the end, you'll turn any design into a fast, accessible interface without blinking.",
    bullets: ["Ship responsive, accessible UI", "Master a modern component framework", "Handle real state & data-fetching"],
    status: "live",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    icon: "shield-check",
    estWeeks: 36,
    category: "Software Engineering",
    outcomeLine:
      "By the end, you'll find real vulnerabilities the way a professional pentester does — and get paid to help companies fix them.",
    bullets: [
      "Master the offensive security toolkit",
      "Practice legally on real-world-grade labs & bug bounties",
      "Land your first pentest role or paid bounty",
    ],
    masteryPath: {
      beginner:
        "How systems really work — networking, Linux, HTTP, how web apps are built, so you can reason about where they break. The law & ethics of hacking: authorization, scope, rules of engagement, responsible disclosure, bug-bounty rules, and building a legal home lab (VMs, Docker) — the rule that separates a paid professional from a criminal. Reconnaissance fundamentals practiced on your own lab targets.",
      intermediate:
        "OWASP Top 10 web vulnerabilities in depth — injection, broken auth, XSS, IDOR, misconfigurations — each practiced on named legal targets (OWASP Juice Shop, WebGoat, DVWA, PortSwigger Web Security Academy). The professional toolkit: Burp Suite, nmap, and friends, against lab targets only. Writing findings up clearly — the report is what you get paid for.",
      advanced:
        "End-to-end penetration testing methodology — recon, exploit, post-exploitation, reporting — against Hack The Box / TryHackMe machines. Chaining vulnerabilities, privilege escalation, and pivoting, all in the lab. Bug-bounty practice: reading a program's scope, hunting on in-scope targets, and writing a disclosure that earns a bounty.",
      mastery:
        "Operating like a professional: real engagement workflow, rules of engagement, client-facing reporting, remediation advice. AI-era security: testing AI/LLM-powered apps for prompt injection, insecure tool use, and data leakage (OWASP LLM Top 10), plus using AI to accelerate recon, code review, and report writing responsibly. Career: building a portfolio (write-ups, bounty reports), a certification path (eJPT toward OSCP), and landing the first pentest role or first paid bounty.",
    },
    status: "live",
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    icon: "bar-chart-3",
    estWeeks: 28,
    category: "Software Engineering",
    outcomeLine: "By the end, raw, messy data won't scare you — you'll turn it into answers.",
    bullets: ["Clean and explore real datasets", "Turn data into decisions with visuals", "Work fluently in modern analytics tooling"],
    status: "live",
  },
  {
    id: "ai-engineering",
    name: "AI Engineering",
    icon: "brain-circuit",
    estWeeks: 36,
    category: "Software Engineering",
    outcomeLine: "By the end, you'll ship real AI features, not just call an API and hope.",
    bullets: ["Build real LLM-powered apps", "Design production AI/agent systems", "Integrate AI into real products"],
    status: "live",
  },

  // ----- New: Data, Cloud & Ops -----
  {
    id: "data-engineering",
    name: "Data Engineering",
    icon: "database",
    estWeeks: 40,
    category: "Data, Cloud & Ops",
    outcomeLine: "By the end, you'll design and run a production data platform — ingestion to governance, not just a pipeline script.",
    bullets: ["Master SQL, modeling & real pipelines", "Stream and batch process at scale (Kafka, Spark)", "Build a warehouse a business can trust"],
    masteryPath: {
      beginner: "SQL mastery, data modeling, relational vs analytical databases",
      intermediate: "Building pipelines (Airflow), Python for data (Pandas), batch ETL patterns",
      advanced: "Streaming (Kafka), distributed processing (Spark), warehouses & dbt (BigQuery/Snowflake concepts)",
      mastery: "Designing a production data platform end-to-end — ingestion, quality, orchestration, cost, governance",
    },
    status: "live",
  },
  {
    id: "cloud-engineering",
    name: "Cloud Engineering",
    icon: "cloud",
    estWeeks: 36,
    category: "Data, Cloud & Ops",
    outcomeLine: "By the end, you'll design and defend cloud architecture at a certification-level depth — not just click around a console.",
    bullets: ["Go deep on core AWS services & IAM", "Automate everything with Terraform", "Design for high availability & cost"],
    masteryPath: {
      beginner: "Cloud fundamentals, core AWS services (EC2, S3, VPC, IAM), shared responsibility model",
      intermediate: "Networking, compute options (serverless vs containers), storage & databases, security foundations",
      advanced: "Infrastructure as Code (Terraform), architecture patterns, high availability, disaster recovery",
      mastery: "Multi-account architecture, cost optimization, landing zones, designing at certification (SA-level) depth",
    },
    status: "live",
  },
  {
    id: "devops",
    name: "DevOps",
    icon: "infinity",
    estWeeks: 36,
    category: "Data, Cloud & Ops",
    outcomeLine: "By the end, you'll run a real internal developer platform — CI/CD, Kubernetes, and the on-call instincts to back it up.",
    bullets: ["Master Docker, CI/CD & GitHub Actions", "Run production Kubernetes with confidence", "Build SRE practice — SLOs & incident response"],
    masteryPath: {
      beginner: "Linux, Git workflows, shell scripting, CI/CD concepts",
      intermediate: "Docker deeply, GitHub Actions pipelines, artifact & environment management",
      advanced: "Kubernetes (deployments, services, helm), observability (metrics, logs, traces), GitOps",
      mastery: "SRE practice — SLOs, incident response, platform engineering, building an internal developer platform",
    },
    status: "live",
  },

  // ----- New: Mobile Engineering (native, grouped behind one display card) -----
  {
    id: "mobile-android",
    name: "Mobile Engineering — Android",
    icon: "smartphone",
    estWeeks: 36,
    category: "Mobile Engineering",
    outcomeLine: "By the end, you'll ship a complete native Android app in Kotlin — with its own backend, live on the Play Store.",
    bullets: ["Kotlin & Jetpack Compose, no shortcuts", "Build the app AND the API behind it", "Ship to the Google Play Store"],
    masteryPath: {
      beginner: "Kotlin fundamentals, Android Studio, app anatomy, first screens",
      intermediate: "Jetpack Compose UI, state, navigation, MVVM architecture",
      advanced: "Networking (Retrofit/Ktor), local persistence (Room), coroutines & flows, testing",
      mastery:
        "Full-Stack Capstone: Ship a Real Product — design a complete app; build its backend API (Node/Express or Supabase, at applied depth); auth + data sync between app and API; offline-first handling; performance pass; CI for mobile; Play Store submission — ending with a published app as the portfolio outcome.",
    },
    status: "live",
    displayGroup: "mobile-engineering",
  },
  {
    id: "mobile-ios",
    name: "Mobile Engineering — iOS",
    icon: "apple",
    estWeeks: 36,
    category: "Mobile Engineering",
    outcomeLine: "By the end, you'll ship a complete native iOS app in Swift — with its own backend, live on the App Store.",
    bullets: ["Swift & SwiftUI, no shortcuts", "Build the app AND the API behind it", "Ship to the App Store via TestFlight"],
    masteryPath: {
      beginner: "Swift fundamentals, Xcode, app lifecycle, first views",
      intermediate: "SwiftUI, state & data flow, navigation, MVVM",
      advanced: "Networking (URLSession/async-await), SwiftData/Core Data, concurrency, testing (XCTest)",
      mastery:
        "Full-Stack Capstone: Ship a Real Product — design a complete app; build its backend API (Node/Express or Supabase, at applied depth); auth + data sync between app and API; offline-first handling; performance pass; CI for mobile; App Store submission via TestFlight — ending with a published app as the portfolio outcome.",
    },
    status: "live",
    displayGroup: "mobile-engineering",
  },
];

/** Copy for a displayGroup card, keyed by displayGroup id. Member tracks stay in TRACKS unmerged. */
export const DISPLAY_GROUPS: Record<
  string,
  Omit<TrackDefinition, "id" | "masteryPath" | "displayGroup" | "estWeeks"> & { estWeeksLabel: string; memberTrackIds: string[] }
> = {
  "mobile-engineering": {
    name: "Mobile Engineering",
    icon: "smartphone",
    estWeeksLabel: "~36w per platform",
    category: "Mobile Engineering",
    outcomeLine:
      "By the end, you'll ship a complete native app — Android in Kotlin or iOS in Swift — with its own backend, live on the store.",
    bullets: ["Go fully native — Kotlin or Swift, no shortcuts", "Build the app AND the API behind it", "Ship to the Play Store or App Store"],
    status: "live",
    memberTrackIds: ["mobile-android", "mobile-ios"],
  },
};

export interface DisplayTrack {
  id: string;
  name: string;
  icon: string;
  estWeeksLabel: string;
  category: TrackCategory;
  outcomeLine: string;
  bullets: [string, string, string];
  status: "live";
  /** Present only for grouped cards (e.g. Mobile Engineering) — the real track ids behind it. */
  memberTrackIds?: string[];
}

/**
 * Collapses tracks sharing a `displayGroup` into one card. Every landing/onboarding/hero
 * surface should render this, not raw TRACKS, so "one Mobile Engineering card" and the
 * live track count both derive from config instead of being hand-counted per surface.
 */
export function groupTracksForDisplay(tracks: TrackDefinition[] = TRACKS): DisplayTrack[] {
  const seenGroups = new Set<string>();
  const result: DisplayTrack[] = [];

  for (const track of tracks) {
    if (track.displayGroup) {
      if (seenGroups.has(track.displayGroup)) continue;
      seenGroups.add(track.displayGroup);
      const group = DISPLAY_GROUPS[track.displayGroup];
      result.push({ id: track.displayGroup, ...group });
      continue;
    }
    result.push({
      id: track.id,
      name: track.name,
      icon: track.icon,
      estWeeksLabel: `~${track.estWeeks}w`,
      category: track.category,
      outcomeLine: track.outcomeLine,
      bullets: track.bullets,
      status: track.status,
    });
  }

  return result;
}

export function findTrack(slug: string): TrackDefinition | undefined {
  return TRACKS.find((t) => t.id === slug);
}

/**
 * The other track id(s) sharing a track's displayGroup (e.g. "mobile-android" -> ["mobile-ios"]).
 * Used by the second-platform accelerator to find what to recommend next — generalizes to any
 * future displayGroup instead of hardcoding the mobile pair.
 */
export function otherTrackIdsInGroup(trackId: string): string[] {
  const track = findTrack(trackId);
  if (!track?.displayGroup) return [];
  const group = DISPLAY_GROUPS[track.displayGroup];
  return group.memberTrackIds.filter((id) => id !== trackId);
}

/** Category display order + label, shared by the landing grid and onboarding picker. */
export const TRACK_CATEGORY_ORDER: TrackCategory[] = ["Software Engineering", "Data, Cloud & Ops", "Mobile Engineering"];
export const TRACK_CATEGORY_LABELS: Record<TrackCategory, string> = {
  "Software Engineering": "Software Engineering",
  "Data, Cloud & Ops": "Data, Cloud & Ops",
  "Mobile Engineering": "Mobile — fully native",
};
