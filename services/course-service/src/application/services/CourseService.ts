import type { IGetCourseAction } from "../interfaces/IGetCourseAction.js";
import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository.js";
import type { ICourseService } from "../interfaces/ICourseService.js";
import type { CourseResponse, ListTrackCoursesResponse, ListEnrolledCoursesResponse } from "@ai-learning-platform/shared";

export class CourseService implements ICourseService {
  constructor(
    private readonly getCourseAction: IGetCourseAction,
    private readonly courseRepo: ICourseRepository,
    private readonly enrollmentRepo: IEnrollmentRepository
  ) {}

  async getCourse(courseId: string): Promise<CourseResponse> {
    return this.getCourseAction.execute(courseId);
  }

  async listAllCourses(): Promise<ListTrackCoursesResponse> {
    const courses = await this.courseRepo.findAllPublished();
    return { courses, total: courses.length };
  }

  async listMyCourses(userId: string): Promise<ListEnrolledCoursesResponse> {
    const courses = await this.enrollmentRepo.findByUserId(userId);
    return { courses, total: courses.length };
  }
}
