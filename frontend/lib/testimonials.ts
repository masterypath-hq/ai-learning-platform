/**
 * Placeholder beta-tester quotes — clearly not real yet. Swap these for actual
 * tester feedback before launch; nothing here should ship to production as-is.
 */
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "The placement question actually mattered — I didn't get stuck re-doing basics I already knew.",
    name: "Beta tester",
    role: "Cybersecurity track",
  },
  {
    quote: "First time a chatbot tutor didn't feel like a search engine with extra steps.",
    name: "Beta tester",
    role: "Backend Engineering track",
  },
  {
    quote: "The cooldown on failed quizzes is annoying in a good way — it stopped me from just guessing.",
    name: "Beta tester",
    role: "AI Engineering track",
  },
];
