/**
 * Course domain entity. No framework or DB imports. (SOLID: S — single responsibility.)
 */
import type { Subject, CourseTrack, CourseLevel, CourseStatus } from "@ai-learning-platform/shared";

export interface CourseProps {
  id: string;
  userId: string;
  subject: Subject;
  track: CourseTrack;
  level: CourseLevel;
  title: string | null;
  description: string | null;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedDurationMinutes: number | null;
  status: CourseStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Course {
  private constructor(private readonly props: CourseProps) {}

  static create(props: CourseProps): Course {
    return new Course(props);
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get subject(): Subject { return this.props.subject; }
  get track(): CourseTrack { return this.props.track; }
  get level(): CourseLevel { return this.props.level; }
  get title(): string | null { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get learningObjectives(): string[] { return this.props.learningObjectives; }
  get prerequisites(): string[] { return this.props.prerequisites; }
  get estimatedDurationMinutes(): number | null { return this.props.estimatedDurationMinutes; }
  get status(): CourseStatus { return this.props.status; }
  get errorMessage(): string | null { return this.props.errorMessage; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): CourseProps {
    return { ...this.props };
  }
}
