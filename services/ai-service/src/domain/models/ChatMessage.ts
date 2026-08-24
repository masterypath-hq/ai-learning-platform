import type { ChatMessageRole } from "@ai-learning-platform/shared";

export interface ChatMessageProps {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;
}

export class ChatMessage {
  private constructor(private readonly props: ChatMessageProps) {}

  static create(props: ChatMessageProps): ChatMessage {
    return new ChatMessage(props);
  }

  get id(): string { return this.props.id; }
  get sessionId(): string { return this.props.sessionId; }
  get role(): ChatMessageRole { return this.props.role; }
  get content(): string { return this.props.content; }
  get createdAt(): Date { return this.props.createdAt; }

  toResponse() {
    return {
      id: this.props.id,
      sessionId: this.props.sessionId,
      role: this.props.role,
      content: this.props.content,
      createdAt: this.props.createdAt.toISOString(),
    };
  }

  toJSON(): ChatMessageProps {
    return { ...this.props };
  }
}
