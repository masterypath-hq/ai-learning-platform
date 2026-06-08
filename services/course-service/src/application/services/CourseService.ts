import type { IGenerateCourseAction } from "../interfaces/IGenerateCourseAction.js";
import type { IGetCourseAction } from "../interfaces/IGetCourseAction.js";
import type { IListUserCoursesAction } from "../interfaces/IListUserCoursesAction.js";
import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { ICourseService } from "../interfaces/ICourseService.js";
import type {
  GenerateCourseRequest,
  GenerateCourseResponse,
  CourseStatusResponse,
  CourseResponse,
  ListCoursesResponse,
  ListTrackCoursesResponse,
  Subject,
  CourseStatus,
} from "@ai-learning-platform/shared";

/**
 * Application service: single entry for course operations. Delegates to actions.
 * (SOLID: D — depends on action interfaces only, not concretions.)
 */
export class CourseService implements ICourseService {
  constructor(
    private readonly generateCourseAction: IGenerateCourseAction,
    private readonly getCourseAction: IGetCourseAction,
    private readonly listUserCoursesAction: IListUserCoursesAction,
    private readonly courseRepo: ICourseRepository
  ) {}

  async generateCourse(userId: string, request: GenerateCourseRequest): Promise<GenerateCourseResponse> {
    return this.generateCourseAction.execute(userId, request);
  }

  async getCourseStatus(courseId: string, userId: string): Promise<CourseStatusResponse> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    if (course.userId !== userId) throw new Error("COURSE_FORBIDDEN");
    return {
      courseId: course.id,
      status: course.status,
      title: course.title ?? undefined,
      errorMessage: course.errorMessage ?? undefined,
    };
  }

  async listAllCourses(): Promise<ListTrackCoursesResponse> {
    const courses = await this.courseRepo.findAllPublished();
    return { courses, total: courses.length };
  }

  async getCourse(courseId: string, userId: string): Promise<CourseResponse> {
    return this.getCourseAction.execute(courseId, userId);
  }

  async listUserCourses(
    userId: string,
    subject?: Subject,
    status?: CourseStatus,
    page?: number,
    limit?: number
  ): Promise<ListCoursesResponse> {
    return this.listUserCoursesAction.execute({ userId, subject, status, page, limit });
  }
}
