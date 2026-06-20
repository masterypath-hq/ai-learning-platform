/**
 * Lesson domain entity. No framework or DB imports. (SOLID: S — single responsibility.)
 */

export interface LessonProps {
  id: string;
  moduleId: string;
  position: number;
  title: string;
  explanationContent: string;
  keyTakeaways: string[];
  estimatedDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Lesson {
  private constructor(private readonly props: LessonProps) {}

  static create(props: LessonProps): Lesson {
    return new Lesson(props);
  }

  get id(): string { return this.props.id; }
  get moduleId(): string { return this.props.moduleId; }
  get position(): number { return this.props.position; }
  get title(): string { return this.props.title; }
  get explanationContent(): string { return this.props.explanationContent; }
  get keyTakeaways(): string[] { return this.props.keyTakeaways; }
  get estimatedDurationMinutes(): number { return this.props.estimatedDurationMinutes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): LessonProps {
    return { ...this.props };
  }
}
