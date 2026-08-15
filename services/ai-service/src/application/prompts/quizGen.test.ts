import { buildCourseFinalPrompt, buildGradeShortAnswersPrompt, buildKnowledgeCheckPrompt, buildModuleQuizPrompt } from "./quizGen.js";

describe("buildKnowledgeCheckPrompt", () => {
  it("asks for 3-5 mcq-only questions grounded in the lesson", () => {
    const { system, user } = buildKnowledgeCheckPrompt({
      title: "Binary Search Trees",
      explanationContent: "A BST is a tree where left < node < right.",
      keyTakeaways: ["Search is O(log n) when balanced"],
    });
    expect(system).toMatch(/3 to 5/);
    expect(system).toMatch(/"type" must be "mcq"/);
    expect(user).toContain("Binary Search Trees");
    expect(user).toContain("Search is O(log n) when balanced");
  });
});

describe("buildModuleQuizPrompt", () => {
  it("asks for 10-15 mixed questions and includes every lesson passed in", () => {
    const { system, user } = buildModuleQuizPrompt(
      { title: "Trees", description: "Tree data structures", keyConcepts: ["BST", "AVL"] },
      [
        { title: "Intro to Trees", explanationContent: "...", keyTakeaways: ["a"] },
        { title: "Balancing", explanationContent: "...", keyTakeaways: ["b"] },
      ]
    );
    expect(system).toMatch(/10 to 15 questions/);
    expect(system).toMatch(/70%/);
    expect(user).toContain("### Intro to Trees");
    expect(user).toContain("### Balancing");
  });
});

describe("buildCourseFinalPrompt", () => {
  it("spans every module rather than one lesson", () => {
    const { system, user } = buildCourseFinalPrompt({
      title: "Backend Engineering",
      learningObjectives: ["Build a REST API"],
      modules: [
        { title: "HTTP Fundamentals", description: "d", keyConcepts: ["requests"] },
        { title: "Databases", description: "d", keyConcepts: ["SQL"] },
      ],
    });
    expect(system).toMatch(/whole course end to end/);
    expect(user).toContain("### HTTP Fundamentals");
    expect(user).toContain("### Databases");
  });
});

describe("buildGradeShortAnswersPrompt", () => {
  it("includes every submitted item for grading, matched by questionId", () => {
    const { system, user } = buildGradeShortAnswersPrompt([
      { questionId: "q1", prompt: "Explain X", correctAnswer: "must mention Y", submittedAnswer: "Y is the reason" },
    ]);
    expect(system).toMatch(/strict but fair grader/);
    expect(user).toContain("q1");
    expect(user).toContain("must mention Y");
  });
});
