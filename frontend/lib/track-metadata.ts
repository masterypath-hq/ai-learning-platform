import {
  Layers,
  Server,
  MonitorSmartphone,
  ShieldCheck,
  BarChart3,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";

export interface TrackMeta {
  icon: LucideIcon;
  outcomes: string[];
  /** Punchy "by the end of this track" line for the card's flip side. */
  mastery: string;
}

/** Hand-authored per-track outcomes — the DB only has a one-line description; this is the "what will I actually learn" story. */
export const TRACK_METADATA: Record<string, TrackMeta> = {
  fullstack: {
    icon: Layers,
    outcomes: ["Design schemas & APIs", "Ship a complete app front-to-back", "Deploy and own the full stack"],
    mastery: "By the end, you'll ship and deploy a complete product on your own — front to back, no hand-holding.",
  },
  backend: {
    icon: Server,
    outcomes: ["Build production-grade APIs", "Model and query real databases", "Reason about distributed systems"],
    mastery: "By the end, you'll design and defend APIs that hold up under real traffic and real data.",
  },
  frontend: {
    icon: MonitorSmartphone,
    outcomes: ["Ship responsive, accessible UI", "Master a modern component framework", "Handle real state & data-fetching"],
    mastery: "By the end, you'll turn any design into a fast, accessible interface without blinking.",
  },
  cybersecurity: {
    icon: ShieldCheck,
    outcomes: ["Think like an attacker and a defender", "Practice offensive & defensive techniques", "Build job-ready security fundamentals"],
    mastery: "By the end, you'll break things on purpose — then know exactly how to lock them down.",
  },
  "data-analysis": {
    icon: BarChart3,
    outcomes: ["Clean and explore real datasets", "Turn data into decisions with visuals", "Work fluently in modern analytics tooling"],
    mastery: "By the end, raw, messy data won't scare you — you'll turn it into answers.",
  },
  "ai-engineering": {
    icon: BrainCircuit,
    outcomes: ["Build real LLM-powered apps", "Design production AI/agent systems", "Integrate AI into real products"],
    mastery: "By the end, you'll ship real AI features, not just call an API and hope.",
  },
};

export const DEFAULT_TRACK_META: TrackMeta = {
  icon: Layers,
  outcomes: [],
  mastery: "By the end, you'll be able to build with this — for real, not just in theory.",
};

export const MASTERY_PHASES = ["Foundation", "Intermediate", "Advanced", "Mastery"] as const;
