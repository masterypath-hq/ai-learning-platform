import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { IListUserCoursesAction, ListUserCoursesParams } from "../interfaces/IListUserCoursesAction.js";
import type { ListCoursesResponse, CourseListItem } from "@ai-learning-platform/shared";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

/** Returns a paginated list of courses for a user. (SOLID: S.) */
export class ListUserCoursesAction implements IListUserCoursesAction {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(params: ListUserCoursesParams): Promise<ListCoursesResponse> {
    const page = Math.max(1, params.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));

    const { courses, total } = await this.courseRepo.findByUserId(
      params.userId,
      { subject: params.subject, status: params.status },
      { page, limit }
    );

    const items: CourseListItem[] = courses.map((c) => ({
      id: c.id,
      subject: c.subject,
      track: c.track,
      level: c.level,
      title: c.title ?? "",
      description: c.description ?? "",
      estimatedDurationMinutes: c.estimatedDurationMinutes ?? 0,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return { courses: items, total, page, limit };
  }
}
