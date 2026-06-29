export interface LessonProps {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  contentUrl: string | null;
  contentType: string;
  durationMins: number | null;
  orderIndex: number;
  isPublished: boolean;
  isProject: boolean;
  projectGithubRequired: boolean;
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
  get slug(): string { return this.props.slug; }
  get title(): string { return this.props.title; }
  get contentUrl(): string | null { return this.props.contentUrl; }
  get contentType(): string { return this.props.contentType; }
  get durationMins(): number | null { return this.props.durationMins; }
  get orderIndex(): number { return this.props.orderIndex; }
  get isPublished(): boolean { return this.props.isPublished; }
  get isProject(): boolean { return this.props.isProject; }
  get projectGithubRequired(): boolean { return this.props.projectGithubRequired; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON(): LessonProps {
    return { ...this.props };
  }
}
