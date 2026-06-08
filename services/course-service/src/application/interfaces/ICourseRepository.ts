import type { Course } from "../../domain/models/Course.js";
import type { Subject, CourseStatus, TrackCourse } from "@ai-learning-platform/shared";

export interface CourseFilters {
  subject?: Subject;
  status?: CourseStatus;
}

export interface CoursePagination {
  page: number;
  limit: number;
}

export interface FindByUserIdResult {
  courses: Course[];
  total: number;
}

export interface CourseDetails {
  title: string;
  description: string;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedDurationMinutes: number;
}

/** Port: course persistence. (SOLID: D — depend on abstraction; I — role-specific interface.) */
export interface ICourseRepository {
  save(course: Course): Promise<void>;
  findById(id: string): Promise<Course | null>;
  findByUserId(
    userId: string,
    filters?: CourseFilters,
    pagination?: CoursePagination
  ): Promise<FindByUserIdResult>;
  updateStatus(id: string, status: CourseStatus, errorMessage?: string): Promise<void>;
  updateDetails(id: string, details: CourseDetails): Promise<void>;
  findAllPublished(): Promise<TrackCourse[]>;
}
