export interface IChatSummaryGenerator {
  /** Single non-streaming Claude call. Returns the raw text response. */
  generate(prompt: string): Promise<string>;
}
