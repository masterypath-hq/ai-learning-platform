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

  it("grounds the phases in the track's masteryPath outline when one exists", () => {
    const { system } = buildCourseOutlinePrompt("data-engineering", "Data Engineering", "Pipelines and platforms.");
    expect(system).toMatch(/SQL mastery, data modeling/i);
    expect(system).toMatch(/production data platform end-to-end/i);
  });

  it("does not add a masteryPath grounding block for tracks that don't define one", () => {
    const { system } = buildCourseOutlinePrompt("backend", "Backend Engineering", "Server-side development.");
    expect(system).not.toMatch(/Ground the four phases/i);
  });

  it("enforces Kotlin-only code for the Android track and Swift-only for iOS", () => {
    const android = buildCourseOutlinePrompt("mobile-android", "Mobile Engineering — Android", "Native Android.");
    expect(android.system).toMatch(/MUST be Kotlin using Jetpack Compose/);
    const ios = buildCourseOutlinePrompt("mobile-ios", "Mobile Engineering — iOS", "Native iOS.");
    expect(ios.system).toMatch(/MUST be Swift using SwiftUI/);
  });

  it("grounds the cybersecurity track in the offensive-security masteryPath and authorization rule", () => {
    const { system } = buildCourseOutlinePrompt("cybersecurity", "Cybersecurity", "Offensive security fundamentals.");
    expect(system).toMatch(/law and ethics of hacking/i);
    expect(system).toMatch(/eJPT toward OSCP/i);
    expect(system).toMatch(/AUTHORIZED to test/);
    expect(system).toMatch(/DVWA, OWASP Juice Shop, WebGoat,\s+PortSwigger Web Security Academy, Hack The Box, TryHackMe/);
    expect(system).toMatch(/Never\s+generate instructions, payloads, or exercises aimed at a specific real-world system/);
  });

  it("does not add the offensive-security safety rule for unrelated tracks", () => {
    const { system } = buildCourseOutlinePrompt("backend", "Backend Engineering", "Server-side development.");
    expect(system).not.toMatch(/AUTHORIZED to test/);
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

  it("carries the offensive-security authorization rule into per-module lesson generation", () => {
    const { system } = buildModuleLessonsPrompt("cybersecurity", {
      phase: "foundation",
      title: "Law, Ethics & Your Home Lab",
      description: "Authorization, scope, and responsible disclosure.",
      keyConcepts: ["authorization", "scope", "responsible disclosure"],
    });
    expect(system).toMatch(/AUTHORIZED to test/);
    expect(system).toMatch(/rules of\nengagement/i);
  });
});
