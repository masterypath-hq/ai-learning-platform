import type { TrackSlug } from "@ai-learning-platform/shared";

export interface CourseProps {
  id: string;
  slug: TrackSlug;
  title: string;
  description: string | null;
  primaryLanguage: string | null;
  thumbnailUrl: string | null;
  durationWeeks: number | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Course {
  private constructor(private readonly props: CourseProps) {}

  static create(props: CourseProps): Course {
    return new Course(props);
  }

  get id(): string { return this.props.id; }
  get slug(): TrackSlug { return this.props.slug; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get primaryLanguage(): string | null { return this.props.primaryLanguage; }
  get thumbnailUrl(): string | null { return this.props.thumbnailUrl; }
  get durationWeeks(): number | null { return this.props.durationWeeks; }
  get isPublished(): boolean { return this.props.isPublished; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): CourseProps {
    return { ...this.props };
  }
}
