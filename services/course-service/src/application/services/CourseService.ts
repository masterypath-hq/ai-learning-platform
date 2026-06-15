import type { IGetCourseAction } from "../interfaces/IGetCourseAction.js";
import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository.js";
import type { IModuleRepository } from "../interfaces/IModuleRepository.js";
import type { ICourseService } from "../interfaces/ICourseService.js";
import type { CourseResponse, ListTrackCoursesResponse, ListEnrolledCoursesResponse, ListModulesResponse } from "@ai-learning-platform/shared";

export class CourseService implements ICourseService {
  constructor(
    private readonly getCourseAction: IGetCourseAction,
    private readonly courseRepo: ICourseRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly moduleRepo: IModuleRepository
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

  async getModulesByCourseId(courseId: string): Promise<ListModulesResponse> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new Error("COURSE_NOT_FOUND");
    const modules = await this.moduleRepo.findByCourseId(courseId);
    return {
      course: {
        ...course.toResponse(),
        modules: modules.map((m) => ({
          id: m.id,
          phase: m.phase,
          title: m.title,
          description: m.description,
          orderIndex: m.orderIndex,
          durationWeeks: m.durationWeeks,
          isPublished: m.isPublished,
        })),
      },
      total: modules.length,
    };
  }
}
