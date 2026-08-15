import type { GradedQuizType, QuestionFeedback, QuizAnswer, QuizQuestion } from "@ai-learning-platform/shared";

export type QuizAttemptStatus = "in_progress" | "submitted";

export interface QuizAttemptProps {
  id: string;
  userId: string;
  courseId: string;
  moduleId: string | null;
  type: GradedQuizType;
  scopeId: string;
  status: QuizAttemptStatus;
  questions: QuizQuestion[]; // full, with answer key — never serialize this straight to the client
  answers: QuizAnswer[] | null;
  score: number | null;
  passed: boolean | null;
  feedback: QuestionFeedback[] | null;
  startedAt: Date;
  submittedAt: Date | null;
}

export class QuizAttempt {
  private constructor(private readonly props: QuizAttemptProps) {}

  static create(props: QuizAttemptProps): QuizAttempt {
    return new QuizAttempt(props);
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get courseId(): string { return this.props.courseId; }
  get moduleId(): string | null { return this.props.moduleId; }
  get type(): GradedQuizType { return this.props.type; }
  get scopeId(): string { return this.props.scopeId; }
  get status(): QuizAttemptStatus { return this.props.status; }
  get questions(): QuizQuestion[] { return this.props.questions; }
  get answers(): QuizAnswer[] | null { return this.props.answers; }
  get score(): number | null { return this.props.score; }
  get passed(): boolean | null { return this.props.passed; }
  get feedback(): QuestionFeedback[] | null { return this.props.feedback; }
  get startedAt(): Date { return this.props.startedAt; }
  get submittedAt(): Date | null { return this.props.submittedAt; }

  toJSON(): QuizAttemptProps {
    return { ...this.props };
  }
}
