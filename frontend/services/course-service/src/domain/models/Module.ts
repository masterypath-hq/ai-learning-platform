/**
 * Module domain entity. No framework or DB imports. (SOLID: S — single responsibility.)
 */

export interface ModuleProps {
  id: string;
  courseId: string;
  position: number;
  theme: string;
  keyConcepts: string[];
  estimatedDurationMinutes: number;
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
  get position(): number { return this.props.position; }
  get theme(): string { return this.props.theme; }
  get keyConcepts(): string[] { return this.props.keyConcepts; }
  get estimatedDurationMinutes(): number { return this.props.estimatedDurationMinutes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): ModuleProps {
    return { ...this.props };
  }
}
