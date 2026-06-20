import type { ListCoursesResponse, Subject, CourseStatus } from "@ai-learning-platform/shared";

export interface ListUserCoursesParams {
  userId: string;
  subject?: Subject;
  status?: CourseStatus;
  page?: number;
  limit?: number;
}

/** Port: list user courses action. (SOLID: I — fine-grained action interface.) */
export interface IListUserCoursesAction {
  execute(params: ListUserCoursesParams): Promise<ListCoursesResponse>;
}
