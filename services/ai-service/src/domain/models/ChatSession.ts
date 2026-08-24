import type { ChatSubjectArea, PhaseLevel } from "@ai-learning-platform/shared";

/** Snapshot of the lesson a session is scoped to, captured at creation so the prompt builder
 *  never needs a fresh course-service call on every message. */
export interface LessonSnapshot {
  title: string;
  explanationContent: string | null;
  keyTakeaways: string[];
  workedExampleTitles: string[];
}

/** One not-yet-reached module, for the "that's covered later" redirect in the tutor prompt. */
export interface CurriculumEntry {
  phase: PhaseLevel;
  title: string;
}

export interface ChatSessionProps {
  id: string;
  userId: string;
  subjectArea: ChatSubjectArea;
  track: string;
  topic: string | null;
  learnerProfile: string | null;
  /** Null only for sessions created before lesson-scoping shipped. */
  lessonId: string | null;
  moduleId: string | null;
  courseId: string | null;
  lessonSnapshot: LessonSnapshot | null;
  curriculumSnapshot: CurriculumEntry[];
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
  get learnerProfile(): string | null { return this.props.learnerProfile; }
  get lessonId(): string | null { return this.props.lessonId; }
  get moduleId(): string | null { return this.props.moduleId; }
  get courseId(): string | null { return this.props.courseId; }
  get lessonSnapshot(): LessonSnapshot | null { return this.props.lessonSnapshot; }
  get curriculumSnapshot(): CurriculumEntry[] { return this.props.curriculumSnapshot; }
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
      learnerProfile: this.props.learnerProfile,
      lessonId: this.props.lessonId,
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
