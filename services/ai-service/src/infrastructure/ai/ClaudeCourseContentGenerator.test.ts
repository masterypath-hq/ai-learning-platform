import { jest } from "@jest/globals";
import type Anthropic from "@anthropic-ai/sdk";
import { ClaudeCourseContentGenerator } from "./ClaudeCourseContentGenerator.js";

const VALID_OUTLINE = {
  learningObjectives: ["Understand X", "Build Y", "Explain Z"],
  prerequisites: [],
  modules: [
    { phase: "foundation", title: "A", description: "d", keyConcepts: ["a", "b", "c"], durationWeeks: 2 },
    { phase: "intermediate", title: "B", description: "d", keyConcepts: ["a", "b", "c"], durationWeeks: 2 },
    { phase: "advanced", title: "C", description: "d", keyConcepts: ["a", "b", "c"], durationWeeks: 2 },
    { phase: "mastery", title: "D", description: "d", keyConcepts: ["a", "b", "c"], durationWeeks: 2 },
    { phase: "foundation", title: "E", description: "d", keyConcepts: ["a", "b", "c"], durationWeeks: 2 },
    { phase: "intermediate", title: "F", description: "d", keyConcepts: ["a", "b", "c"], durationWeeks: 2 },
  ],
};

function textResponse(payload: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(payload) }] };
}

function makeClient(...responses: unknown[]): Anthropic {
  const create = jest.fn();
  for (const response of responses) {
    create.mockResolvedValueOnce(response as never);
  }
  return { messages: { create } } as unknown as Anthropic;
}

describe("ClaudeCourseContentGenerator.generateCourseOutline", () => {
  it("returns the parsed outline on a valid first response", async () => {
    const client = makeClient(textResponse(VALID_OUTLINE));
    const generator = new ClaudeCourseContentGenerator(client);

    const result = await generator.generateCourseOutline("backend", "Backend Engineering", "desc");

    expect(result.modules).toHaveLength(6);
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it("retries once with validation errors appended when the first response is invalid, then succeeds", async () => {
    const invalid = { learningObjectives: [], prerequisites: [], modules: [] };
    const client = makeClient(textResponse(invalid), textResponse(VALID_OUTLINE));
    const generator = new ClaudeCourseContentGenerator(client);

    const result = await generator.generateCourseOutline("backend", "Backend Engineering", "desc");

    expect(result.modules).toHaveLength(6);
    expect(client.messages.create).toHaveBeenCalledTimes(2);
    const secondCallArgs = (client.messages.create as jest.Mock).mock.calls[1][0] as { messages: { content: string }[] };
    expect(secondCallArgs.messages[0].content).toMatch(/failed validation/i);
  });

  it("throws after the retry also fails validation", async () => {
    const invalid = { learningObjectives: [], prerequisites: [], modules: [] };
    const client = makeClient(textResponse(invalid), textResponse(invalid));
    const generator = new ClaudeCourseContentGenerator(client);

    await expect(generator.generateCourseOutline("backend", "Backend Engineering", "desc")).rejects.toThrow(
      /failed validation after retry/i
    );
    expect(client.messages.create).toHaveBeenCalledTimes(2);
  });
});
