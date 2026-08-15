import { buildTutorSystemPrompt } from "./tutor.js";

describe("buildTutorSystemPrompt", () => {
  it("instructs runnable code examples for programming tracks", () => {
    const prompt = buildTutorSystemPrompt("programming", "cybersecurity", null);
    expect(prompt).toMatch(/runnable, commented code example/i);
    expect(prompt).not.toMatch(/risk|disclaimer/i);
  });

  it("instructs a risk disclaimer and no live prices for finance tracks", () => {
    const prompt = buildTutorSystemPrompt("finance", "forex", "day trading basics");
    expect(prompt).toMatch(/not financial advice/i);
    expect(prompt).toMatch(/never state or imply a live\/current market price/i);
    expect(prompt).toContain('"day trading basics"');
  });

  it("asks for exactly one Socratic follow-up question after explaining", () => {
    const prompt = buildTutorSystemPrompt("programming", "python", null);
    expect(prompt).toMatch(/exactly one follow-up question/i);
  });
});
