export interface TutorStreamerMessage {
  role: "user" | "assistant";
  content: string;
}

export type TutorStreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "error"; message: string };

export interface ITutorStreamer {
  stream(
    systemPrompt: string,
    messages: TutorStreamerMessage[],
    signal?: AbortSignal
  ): AsyncIterable<TutorStreamEvent>;
}
