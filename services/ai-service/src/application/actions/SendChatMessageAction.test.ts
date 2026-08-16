import { jest } from "@jest/globals";
import { SendChatMessageAction } from "./SendChatMessageAction.js";
import { ChatSession } from "../../domain/models/ChatSession.js";
import { ChatMessage } from "../../domain/models/ChatMessage.js";
import type { IChatSessionRepository } from "../interfaces/IChatSessionRepository.js";
import type { IChatMessageRepository } from "../interfaces/IChatMessageRepository.js";
import type { ITutorStreamer, TutorStreamEvent, TutorStreamerMessage } from "../interfaces/ITutorStreamer.js";
import type { ChatStreamEvent, IChatStreamPublisher } from "../interfaces/IChatStreamPublisher.js";

function makeSession(overrides: Partial<Parameters<typeof ChatSession.create>[0]> = {}): ChatSession {
  return ChatSession.create({
    id: "session-1",
    userId: "user-1",
    subjectArea: "programming",
    track: "cybersecurity",
    topic: null,
    learnerProfile: null,
    summary: null,
    suggestedNextQuestions: [],
    createdAt: new Date(),
    closedAt: null,
    ...overrides,
  });
}

function makeMessage(overrides: Partial<Parameters<typeof ChatMessage.create>[0]>): ChatMessage {
  return ChatMessage.create({
    id: "m",
    sessionId: "session-1",
    role: "user",
    content: "",
    createdAt: new Date(),
    ...overrides,
  });
}

function makeChatSessionRepo(overrides: Partial<IChatSessionRepository> = {}): IChatSessionRepository {
  return {
    create: jest.fn<IChatSessionRepository["create"]>(),
    findById: jest.fn<IChatSessionRepository["findById"]>().mockResolvedValue(null),
    findByUserId: jest.fn<IChatSessionRepository["findByUserId"]>(),
    close: jest.fn<IChatSessionRepository["close"]>(),
    ...overrides,
  };
}

function makeChatMessageRepo(overrides: Partial<IChatMessageRepository> = {}): IChatMessageRepository {
  return {
    create: jest.fn<IChatMessageRepository["create"]>(),
    findBySessionId: jest.fn<IChatMessageRepository["findBySessionId"]>().mockResolvedValue([]),
    ...overrides,
  };
}

describe("SendChatMessageAction", () => {
  it("rejects a message to a session owned by another user", async () => {
    const chatSessionRepo = makeChatSessionRepo({
      findById: jest.fn<IChatSessionRepository["findById"]>().mockResolvedValue(makeSession({ userId: "someone-else" })),
    });
    const chatMessageRepo = makeChatMessageRepo();
    const streamer: ITutorStreamer = { stream: jest.fn() as unknown as ITutorStreamer["stream"] };
    const publisher: IChatStreamPublisher = { publish: jest.fn<IChatStreamPublisher["publish"]>() };

    const action = new SendChatMessageAction(chatSessionRepo, chatMessageRepo, streamer, publisher);

    await expect(action.execute("user-1", "session-1", "hi")).rejects.toThrow("SESSION_FORBIDDEN");
  });

  it("rejects a message to a closed session", async () => {
    const chatSessionRepo = makeChatSessionRepo({
      findById: jest.fn<IChatSessionRepository["findById"]>().mockResolvedValue(makeSession({ closedAt: new Date() })),
    });
    const chatMessageRepo = makeChatMessageRepo();
    const streamer: ITutorStreamer = { stream: jest.fn() as unknown as ITutorStreamer["stream"] };
    const publisher: IChatStreamPublisher = { publish: jest.fn<IChatStreamPublisher["publish"]>() };

    const action = new SendChatMessageAction(chatSessionRepo, chatMessageRepo, streamer, publisher);

    await expect(action.execute("user-1", "session-1", "hi")).rejects.toThrow("SESSION_CLOSED");
  });

  it("truncates history to the most recent 40 messages before calling the streamer, and persists the streamed reply", async () => {
    const session = makeSession();
    const history = Array.from({ length: 50 }, (_, i) =>
      makeMessage({
        id: `m${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `msg-${i}`,
      })
    );

    const chatSessionRepo = makeChatSessionRepo({
      findById: jest.fn<IChatSessionRepository["findById"]>().mockResolvedValue(session),
    });

    const createdMessages: { role: string; content: string }[] = [];
    const chatMessageRepo = makeChatMessageRepo({
      create: jest.fn<IChatMessageRepository["create"]>(async (params) => {
        createdMessages.push({ role: params.role, content: params.content });
        return makeMessage({ id: "new", role: params.role, content: params.content });
      }),
      findBySessionId: jest.fn<IChatMessageRepository["findBySessionId"]>().mockResolvedValue(history),
    });

    let capturedMessages: TutorStreamerMessage[] = [];
    const streamer: ITutorStreamer = {
      stream: (function () {
        async function* impl(
          _systemPrompt: string,
          messages: TutorStreamerMessage[]
        ): AsyncGenerator<TutorStreamEvent> {
          capturedMessages = messages;
          yield { type: "text_delta", text: "Hello " };
          yield { type: "text_delta", text: "there." };
        }
        return impl;
      })(),
    };

    const publishedEvents: ChatStreamEvent[] = [];
    let resolveDone!: () => void;
    const donePromise = new Promise<void>((resolve) => {
      resolveDone = resolve;
    });
    const publisher: IChatStreamPublisher = {
      publish: jest.fn<IChatStreamPublisher["publish"]>(async (_sessionId, event) => {
        publishedEvents.push(event);
        if (event.type === "done") resolveDone();
      }),
    };

    const action = new SendChatMessageAction(chatSessionRepo, chatMessageRepo, streamer, publisher);
    const result = await action.execute("user-1", "session-1", "What is a binary search tree?");
    await donePromise;

    expect(result.role).toBe("user");
    expect(result.content).toBe("What is a binary search tree?");

    expect(capturedMessages).toHaveLength(40);
    expect(capturedMessages[0].content).toBe("msg-10");
    expect(capturedMessages[capturedMessages.length - 1].content).toBe("msg-49");

    expect(publishedEvents).toEqual([
      { type: "token", text: "Hello " },
      { type: "token", text: "there." },
      { type: "done" },
    ]);
    expect(createdMessages).toContainEqual({ role: "assistant", content: "Hello there." });
  });
});
