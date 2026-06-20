/**
 * WorkedExample domain entity. No framework or DB imports. (SOLID: S — single responsibility.)
 */

export interface WorkedExampleProps {
  id: string;
  lessonId: string;
  position: number;
  title: string;
  content: string;
  solution: string;
  createdAt: Date;
}

export class WorkedExample {
  private constructor(private readonly props: WorkedExampleProps) {}

  static create(props: WorkedExampleProps): WorkedExample {
    return new WorkedExample(props);
  }

  get id(): string { return this.props.id; }
  get lessonId(): string { return this.props.lessonId; }
  get position(): number { return this.props.position; }
  get title(): string { return this.props.title; }
  get content(): string { return this.props.content; }
  get solution(): string { return this.props.solution; }
  get createdAt(): Date { return this.props.createdAt; }

  toJSON(): WorkedExampleProps {
    return { ...this.props };
  }
}
