import type { TrackSlug, CourseResponse } from "@ai-learning-platform/shared";

export interface CourseProps {
  id: string;
  slug: TrackSlug;
  title: string;
  description: string | null;
  primaryLanguage: string | null;
  thumbnailUrl: string | null;
  durationWeeks: number | null;
  learningObjectives: string[];
  prerequisites: string[];
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
  get learningObjectives(): string[] { return this.props.learningObjectives; }
  get prerequisites(): string[] { return this.props.prerequisites; }
  get isPublished(): boolean { return this.props.isPublished; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toResponse(): Omit<CourseResponse, "modules"> {
    return {
      id: this.props.id,
      slug: this.props.slug,
      title: this.props.title,
      description: this.props.description,
      primaryLanguage: this.props.primaryLanguage,
      thumbnailUrl: this.props.thumbnailUrl,
      durationWeeks: this.props.durationWeeks,
      learningObjectives: this.props.learningObjectives,
      prerequisites: this.props.prerequisites,
      isPublished: this.props.isPublished,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  toJSON(): CourseProps {
    return { ...this.props };
  }
}
