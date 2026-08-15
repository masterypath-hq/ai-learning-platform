import { TRACK_METADATA } from "./track-metadata";

export interface AuthShowcaseSlide {
  image: string;
  track: string;
  outcome: string;
  alt: string;
  /** Optional small glass vignette over the photo — only built for these two tracks. */
  accent?: "terminal" | "nodes";
}

export const AUTH_SHOWCASE_SLIDES: AuthShowcaseSlide[] = [
  {
    image: "/auth/cyber.jpg",
    track: "Cybersecurity",
    outcome: TRACK_METADATA.cybersecurity.mastery,
    alt: "A security analyst working late at a dimly lit desk, her face lit by the monitor.",
    accent: "terminal",
  },
  {
    image: "/auth/ai.jpg",
    track: "AI Engineering",
    outcome: TRACK_METADATA["ai-engineering"].mastery,
    alt: "Two colleagues in a mid-discussion gesture, one pointing at a laptop screen.",
    accent: "nodes",
  },
  {
    image: "/auth/backend.jpg",
    track: "Backend Engineering",
    outcome: TRACK_METADATA.backend.mastery,
    alt: "A developer's multi-monitor setup at night, code lit up on the screens.",
  },
  {
    image: "/auth/data.jpg",
    track: "Data Analysis",
    outcome: TRACK_METADATA["data-analysis"].mastery,
    alt: "Someone reviewing charts and dashboards on a laptop at a desk.",
  },
  {
    image: "/auth/frontend.jpg",
    track: "Frontend Engineering",
    outcome: TRACK_METADATA.frontend.mastery,
    alt: "A team around a table with laptops, a colorful website design displayed on a large screen.",
  },
  {
    image: "/auth/fullstack.jpg",
    track: "Full-Stack Engineering",
    outcome: TRACK_METADATA.fullstack.mastery,
    alt: "Two developers pairing at one desk, looking at code together.",
  },
];
