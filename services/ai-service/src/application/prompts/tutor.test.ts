import { buildTutorSystemPrompt, formatLearnerProfile } from "./tutor.js";

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

  it("uses the learner profile hint instead of the infer-from-conversation instruction when provided", () => {
    const prompt = buildTutorSystemPrompt(
      "programming",
      "mobile-ios",
      null,
      "experienced mobile developer, new to Kotlin"
    );
    expect(prompt).toContain("experienced mobile developer, new to Kotlin");
    expect(prompt).not.toMatch(/you have no separate profile for this learner/i);
  });

  it("falls back to inferring level from the conversation when no profile is given", () => {
    const prompt = buildTutorSystemPrompt("programming", "python", null);
    expect(prompt).toMatch(/you have no separate profile for this learner/i);
  });

  it("adds the authorization-principle redirect for the cybersecurity track", () => {
    const prompt = buildTutorSystemPrompt("programming", "cybersecurity", null);
    expect(prompt).toMatch(/professionals only ever work under a signed scope/i);
    expect(prompt).toMatch(/Hack The Box\/TryHackMe/);
  });

  it("does not add cybersecurity track guidance for other programming tracks", () => {
    const prompt = buildTutorSystemPrompt("programming", "python", null);
    expect(prompt).not.toMatch(/signed scope/i);
  });
});

describe("formatLearnerProfile", () => {
  it("joins level, goal, and prior experience when all are present", () => {
    const profile = formatLearnerProfile({
      selfAssessedLevel: "advanced",
      goal: "become a pentester",
      priorExperienceSkillNames: ["Networking", "Linux"],
    });
    expect(profile).toBe('self-assessed level: advanced; stated goal: "become a pentester"; already confident in: Networking, Linux');
  });

  it("omits parts that are missing", () => {
    const profile = formatLearnerProfile({
      selfAssessedLevel: "complete_beginner",
      goal: null,
      priorExperienceSkillNames: [],
    });
    expect(profile).toBe("self-assessed level: complete beginner");
  });

  it("returns null when the enrollment carries none of the three signals", () => {
    const profile = formatLearnerProfile({ selfAssessedLevel: null, goal: null, priorExperienceSkillNames: [] });
    expect(profile).toBeNull();
  });
});
