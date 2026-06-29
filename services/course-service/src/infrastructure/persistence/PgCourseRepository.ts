import type { Pool } from "pg";
import { Course } from "../../domain/models/Course.js";
import type { ICourseRepository } from "../../application/interfaces/ICourseRepository.js";
import type { TrackCourse, TrackSlug } from "@ai-learning-platform/shared";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  primary_language: string | null;
  thumbnail_url: string | null;
  duration_weeks: number | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
};

export class PgCourseRepository implements ICourseRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Course | null> {
    const result = await this.pool.query<CourseRow>(
      `SELECT id, slug, title, description, primary_language, thumbnail_url, duration_weeks, is_published, created_at, updated_at
       FROM courses WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.rowToCourse(result.rows[0]);
  }

  async findAllPublished(): Promise<TrackCourse[]> {
    const result = await this.pool.query<CourseRow>(
      `SELECT id, slug, title, description, primary_language, thumbnail_url, duration_weeks, is_published, created_at, updated_at
       FROM courses WHERE is_published = true ORDER BY title ASC`
    );
    return result.rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      primaryLanguage: r.primary_language,
      thumbnailUrl: r.thumbnail_url,
      durationWeeks: r.duration_weeks,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }));
  }

  private rowToCourse(row: CourseRow): Course {
    return Course.create({
      id: row.id,
      slug: row.slug as TrackSlug,
      title: row.title,
      description: row.description,
      primaryLanguage: row.primary_language,
      thumbnailUrl: row.thumbnail_url,
      durationWeeks: row.duration_weeks,
      isPublished: row.is_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
