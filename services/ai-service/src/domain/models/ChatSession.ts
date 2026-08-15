import type { ChatSubjectArea } from "@ai-learning-platform/shared";

export interface ChatSessionProps {
  id: string;
  userId: string;
  subjectArea: ChatSubjectArea;
  track: string;
  topic: string | null;
  summary: string | null;
  suggestedNextQuestions: string[];
  createdAt: Date;
  closedAt: Date | null;
}

export class ChatSession {
  private constructor(private readonly props: ChatSessionProps) {}

  static create(props: ChatSessionProps): ChatSession {
    return new ChatSession(props);
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get subjectArea(): ChatSubjectArea { return this.props.subjectArea; }
  get track(): string { return this.props.track; }
  get topic(): string | null { return this.props.topic; }
  get summary(): string | null { return this.props.summary; }
  get suggestedNextQuestions(): string[] { return this.props.suggestedNextQuestions; }
  get createdAt(): Date { return this.props.createdAt; }
  get closedAt(): Date | null { return this.props.closedAt; }

  toResponse() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      subjectArea: this.props.subjectArea,
      track: this.props.track,
      topic: this.props.topic,
      summary: this.props.summary,
      suggestedNextQuestions: this.props.suggestedNextQuestions,
      createdAt: this.props.createdAt.toISOString(),
      closedAt: this.props.closedAt ? this.props.closedAt.toISOString() : null,
    };
  }

  toJSON(): ChatSessionProps {
    return { ...this.props };
  }
}
