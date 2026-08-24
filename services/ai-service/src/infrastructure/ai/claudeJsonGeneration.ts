import type Anthropic from "@anthropic-ai/sdk";
import { APIConnectionError, APIError, InternalServerError, RateLimitError } from "@anthropic-ai/sdk";
import type { ZodType } from "zod";
import type { ClaudeUsage } from "../../application/interfaces/ICourseContentGenerator.js";

const MODEL = "claude-sonnet-4-5";
// Transient-error retry, separate from the JSON-validation-repair retry below: covers rate limits,
// overload, and connection drops that the SDK's own default retries don't fully absorb for a
// long-running batch script. 3 attempts = 1 initial try + 2 backoff retries.
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;

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

function isRetryableError(err: unknown): boolean {
  if (err instanceof RateLimitError || err instanceof InternalServerError || err instanceof APIConnectionError) {
    return true;
  }
  // Catches overloaded_error (529) and any other 5xx not mapped to InternalServerError.
  return err instanceof APIError && typeof err.status === "number" && err.status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callClaude(
  client: Anthropic,
  maxTokens: number,
  system: string,
  user: string
): Promise<{ text: string; usage: ClaudeUsage }> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      });
      const response = await stream.finalMessage();
      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Unexpected non-text response from Claude");
      }
      return {
        text: textBlock.text,
        usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      };
    } catch (err) {
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      if (isLastAttempt || !isRetryableError(err)) throw err;
      const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[claudeJsonGeneration] Transient error on attempt ${attempt}/${MAX_ATTEMPTS} (${message}). Retrying in ${delayMs}ms...`
      );
      await sleep(delayMs);
    }
  }
  // Unreachable — the loop always returns or throws — but keeps TS happy about a return path.
  throw new Error("Retry loop exited without returning or throwing");
}

// JSON-validation-repair retry, separate from the transient-error retry inside callClaude:
// covers Claude returning well-formed JSON that violates the schema (e.g. an array exceeding
// its max length despite the prompt stating the bound). 3 attempts = 1 initial try + 2 repairs.
const MAX_VALIDATION_ATTEMPTS = 3;

/**
 * Calls Claude, validates the JSON response against `schema`, and retries with the validation
 * errors appended to the prompt each time the response fails to parse or validate.
 * Each underlying call also retries transient API errors (429/5xx/connection) with backoff.
 * Returns cumulative token usage across every call made, for cost logging.
 */
export async function generateValidatedJson<T>(
  client: Anthropic,
  maxTokens: number,
  system: string,
  user: string,
  schema: ZodType<T>
): Promise<{ data: T; usage: ClaudeUsage }> {
  const usage: ClaudeUsage = { inputTokens: 0, outputTokens: 0 };
  let currentUser = user;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_VALIDATION_ATTEMPTS; attempt++) {
    const response = await callClaude(client, maxTokens, system, currentUser);
    usage.inputTokens += response.usage.inputTokens;
    usage.outputTokens += response.usage.outputTokens;

    const result = parseAndValidate(response.text, schema);
    if (result.data !== null) return { data: result.data, usage };

    lastError = result.error;
    currentUser = `${user}

Your previous response failed validation with these errors:
${result.error}

Return ONLY the corrected JSON, following the exact structure described above.`;
  }

  throw new Error(`Generation failed validation after ${MAX_VALIDATION_ATTEMPTS} attempts: ${lastError}`);
}
