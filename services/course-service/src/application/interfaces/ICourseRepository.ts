import type { Course } from "../../domain/models/Course.js";
import type { TrackCourse } from "@ai-learning-platform/shared";

export interface ICourseRepository {
  findById(id: string): Promise<Course | null>;
  findAllPublished(): Promise<TrackCourse[]>;
}
