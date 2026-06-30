import type { Course } from "../../domain/models/Course.js";
import type { TrackCategoryResponse, TrackCourse } from "@ai-learning-platform/shared";

export interface ICourseRepository {
  findById(id: string): Promise<Course | null>;
  findBySlug(slug: string): Promise<Course | null>;
  findAllPublished(): Promise<TrackCourse[]>;
  findAllGroupedByCategory(): Promise<TrackCategoryResponse[]>;
}
