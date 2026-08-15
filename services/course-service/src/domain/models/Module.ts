import type { PhaseLevel } from "@ai-learning-platform/shared";

export interface ModuleProps {
  id: string;
  courseId: string;
  phase: PhaseLevel;
  title: string;
  description: string | null;
  keyConcepts: string[];
  orderIndex: number;
  durationWeeks: number | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Module {
  private constructor(private readonly props: ModuleProps) {}

  static create(props: ModuleProps): Module {
    return new Module(props);
  }

  get id(): string { return this.props.id; }
  get courseId(): string { return this.props.courseId; }
  get phase(): PhaseLevel { return this.props.phase; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get keyConcepts(): string[] { return this.props.keyConcepts; }
  get orderIndex(): number { return this.props.orderIndex; }
  get durationWeeks(): number | null { return this.props.durationWeeks; }
  get isPublished(): boolean { return this.props.isPublished; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): ModuleProps {
    return { ...this.props };
  }
}
