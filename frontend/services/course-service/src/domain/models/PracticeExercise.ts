/**
 * PracticeExercise domain entity. No framework or DB imports. (SOLID: S — single responsibility.)
 */

export interface PracticeExerciseProps {
  id: string;
  lessonId: string;
  title: string;
  prompt: string;
  hints: string[];
  sampleSolution: string;
  createdAt: Date;
}

export class PracticeExercise {
  private constructor(private readonly props: PracticeExerciseProps) {}

  static create(props: PracticeExerciseProps): PracticeExercise {
    return new PracticeExercise(props);
  }

  get id(): string { return this.props.id; }
  get lessonId(): string { return this.props.lessonId; }
  get title(): string { return this.props.title; }
  get prompt(): string { return this.props.prompt; }
  get hints(): string[] { return this.props.hints; }
  get sampleSolution(): string { return this.props.sampleSolution; }
  get createdAt(): Date { return this.props.createdAt; }

  toJSON(): PracticeExerciseProps {
    return { ...this.props };
  }
}
