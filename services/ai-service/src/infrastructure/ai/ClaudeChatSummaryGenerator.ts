import Anthropic from "@anthropic-ai/sdk";
import type { IChatSummaryGenerator } from "../../application/interfaces/IChatSummaryGenerator.js";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 1024;

export class ClaudeChatSummaryGenerator implements IChatSummaryGenerator {
  constructor(private readonly client: Anthropic) {}

  async generate(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text : "";
  }
}
