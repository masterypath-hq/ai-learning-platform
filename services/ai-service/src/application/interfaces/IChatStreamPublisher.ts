export type ChatStreamEvent =
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export interface IChatStreamPublisher {
  publish(sessionId: string, event: ChatStreamEvent): Promise<void>;
}
