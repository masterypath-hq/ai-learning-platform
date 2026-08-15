import { buildCourseOutlinePrompt, buildModuleLessonsPrompt } from "./courseGen.js";

describe("buildCourseOutlinePrompt", () => {
  it("requires every phase to be covered and only valid JSON in the response", () => {
    const { system, user } = buildCourseOutlinePrompt("backend", "Backend Engineering", "Server-side development.");
    expect(system).toMatch(/foundation, intermediate,\s+advanced, mastery/i);
    expect(system).toMatch(/ONLY valid JSON/);
    expect(system).toMatch(/6 to 10 modules/i);
    expect(user).toContain("Track: backend");
    expect(user).toContain("Backend Engineering");
  });
});

describe("buildModuleLessonsPrompt", () => {
  it("asks for runnable code and includes the module's key concepts", () => {
    const { system, user } = buildModuleLessonsPrompt("backend", {
      phase: "foundation",
      title: "HTTP Fundamentals",
      description: "How the web talks.",
      keyConcepts: ["requests", "responses", "status codes"],
    });
    expect(system).toMatch(/runnable/i);
    expect(system).toMatch(/3 to 5 lessons/i);
    expect(user).toContain("Phase: foundation");
    expect(user).toContain("requests, responses, status codes");
  });
});
