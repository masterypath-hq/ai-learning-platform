import type Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";

const MODEL = "claude-sonnet-4-5";

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function parseAndValidate<T>(raw: string, schema: ZodType<T>): { data: T | null; error: string | null } {
  let json: unknown;
  try {
    json = JSON.parse(stripMarkdownFences(raw));
  } catch (err) {
    return { data: null, error: `Response was not valid JSON: ${err instanceof Error ? err.message : String(err)}` };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { data: null, error: JSON.stringify(parsed.error.flatten()) };
  }
  return { data: parsed.data, error: null };
}

async function callClaude(client: Anthropic, maxTokens: number, system: string, user: string): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Unexpected non-text response from Claude");
  }
  return textBlock.text;
}

/**
 * Calls Claude, validates the JSON response against `schema`, and retries once with the
 * validation errors appended to the prompt if the first attempt fails to parse or validate.
 */
export async function generateValidatedJson<T>(
  client: Anthropic,
  maxTokens: number,
  system: string,
  user: string,
  schema: ZodType<T>
): Promise<T> {
  const first = parseAndValidate(await callClaude(client, maxTokens, system, user), schema);
  if (first.data !== null) return first.data;

  const retryUser = `${user}

Your previous response failed validation with these errors:
${first.error}

Return ONLY the corrected JSON, following the exact structure described above.`;
  const second = parseAndValidate(await callClaude(client, maxTokens, system, retryUser), schema);
  if (second.data !== null) return second.data;

  throw new Error(`Generation failed validation after retry: ${second.error}`);
}
