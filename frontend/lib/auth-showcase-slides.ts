import { findTrack, DISPLAY_GROUPS } from "@ai-learning-platform/shared";

export interface AuthShowcaseSlide {
  image: string;
  track: string;
  outcome: string;
  alt: string;
  /** Optional small glass vignette over the photo — only built for these two tracks. */
  accent?: "terminal" | "nodes";
}

function outcomeOf(slug: string): string {
  return findTrack(slug)?.outcomeLine ?? "";
}

export const AUTH_SHOWCASE_SLIDES: AuthShowcaseSlide[] = [
  {
    image: "/auth/cyber.jpg",
    track: "Cybersecurity",
    outcome: outcomeOf("cybersecurity"),
    alt: "A security analyst working late at a dimly lit desk, her face lit by the monitor.",
    accent: "terminal",
  },
  {
    image: "/auth/ai.jpg",
    track: "AI Engineering",
    outcome: outcomeOf("ai-engineering"),
    alt: "Two colleagues in a mid-discussion gesture, one pointing at a laptop screen.",
    accent: "nodes",
  },
  {
    image: "/auth/backend.jpg",
    track: "Backend Engineering",
    outcome: outcomeOf("backend"),
    alt: "A developer's multi-monitor setup at night, code lit up on the screens.",
  },
  {
    image: "/auth/data.jpg",
    track: "Data Analysis",
    outcome: outcomeOf("data-analysis"),
    alt: "Someone reviewing charts and dashboards on a laptop at a desk.",
  },
  {
    image: "/auth/frontend.jpg",
    track: "Frontend Engineering",
    outcome: outcomeOf("frontend"),
    alt: "A team around a table with laptops, a colorful website design displayed on a large screen.",
  },
  {
    image: "/auth/fullstack.jpg",
    track: "Full-Stack Engineering",
    outcome: outcomeOf("fullstack"),
    alt: "Two developers pairing at one desk, looking at code together.",
  },
  {
    image: "/auth/data-eng.jpg",
    track: "Data Engineering",
    outcome: outcomeOf("data-engineering"),
    alt: "A team planning around a whiteboard covered in diagrams and sticky notes.",
  },
  {
    image: "/auth/cloud.jpg",
    track: "Cloud Engineering",
    outcome: outcomeOf("cloud-engineering"),
    alt: "A close-up of a server rack's drive bays, lit by green status lights.",
  },
  {
    image: "/auth/devops.jpg",
    track: "DevOps",
    outcome: outcomeOf("devops"),
    alt: "A code editor glowing on a monitor at a dim, multi-screen desk setup.",
  },
  {
    image: "/auth/mobile.jpg",
    track: "Mobile Engineering",
    outcome: DISPLAY_GROUPS["mobile-engineering"].outcomeLine,
    alt: "A hand tapping through an app's interface on a physical phone.",
  },
];
