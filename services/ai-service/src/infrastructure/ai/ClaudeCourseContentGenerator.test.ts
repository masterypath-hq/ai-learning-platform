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

function finalMessage(payload: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    usage: { input_tokens: 100, output_tokens: 200 },
  };
}

function makeClient(...payloads: unknown[]): Anthropic {
  const stream = jest.fn();
  for (const payload of payloads) {
    stream.mockReturnValueOnce({ finalMessage: () => Promise.resolve(finalMessage(payload)) } as never);
  }
  return { messages: { stream } } as unknown as Anthropic;
}

describe("ClaudeCourseContentGenerator.generateCourseOutline", () => {
  it("returns the parsed outline and token usage on a valid first response", async () => {
    const client = makeClient(VALID_OUTLINE);
    const generator = new ClaudeCourseContentGenerator(client);

    const result = await generator.generateCourseOutline("backend", "Backend Engineering", "desc");

    expect(result.data.modules).toHaveLength(6);
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 200 });
    expect(client.messages.stream).toHaveBeenCalledTimes(1);
  });

  it("retries once with validation errors appended when the first response is invalid, then succeeds", async () => {
    const invalid = { learningObjectives: [], prerequisites: [], modules: [] };
    const client = makeClient(invalid, VALID_OUTLINE);
    const generator = new ClaudeCourseContentGenerator(client);

    const result = await generator.generateCourseOutline("backend", "Backend Engineering", "desc");

    expect(result.data.modules).toHaveLength(6);
    expect(result.usage).toEqual({ inputTokens: 200, outputTokens: 400 });
    expect(client.messages.stream).toHaveBeenCalledTimes(2);
    const secondCallArgs = (client.messages.stream as jest.Mock).mock.calls[1][0] as { messages: { content: string }[] };
    expect(secondCallArgs.messages[0].content).toMatch(/failed validation/i);
  });

  it("retries a second time and succeeds when the first repair attempt is still invalid", async () => {
    const invalid = { learningObjectives: [], prerequisites: [], modules: [] };
    const client = makeClient(invalid, invalid, VALID_OUTLINE);
    const generator = new ClaudeCourseContentGenerator(client);

    const result = await generator.generateCourseOutline("backend", "Backend Engineering", "desc");

    expect(result.data.modules).toHaveLength(6);
    expect(client.messages.stream).toHaveBeenCalledTimes(3);
  });

  it("throws after all repair attempts fail validation", async () => {
    const invalid = { learningObjectives: [], prerequisites: [], modules: [] };
    const client = makeClient(invalid, invalid, invalid);
    const generator = new ClaudeCourseContentGenerator(client);

    await expect(generator.generateCourseOutline("backend", "Backend Engineering", "desc")).rejects.toThrow(
      /failed validation after 3 attempts/i
    );
    expect(client.messages.stream).toHaveBeenCalledTimes(3);
  });
});
