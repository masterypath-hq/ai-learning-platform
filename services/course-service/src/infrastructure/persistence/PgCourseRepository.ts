import type { Pool } from "pg";
import { Course } from "../../domain/models/Course.js";
import type { ICourseRepository } from "../../application/interfaces/ICourseRepository.js";
import type { TrackCategoryResponse, TrackCourse, TrackSlug } from "@ai-learning-platform/shared";

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

type CourseWithCategoryRow = CourseRow & {
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_icon: string | null;
  category_order_index: number | null;
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

  async findBySlug(slug: string): Promise<Course | null> {
    const result = await this.pool.query<CourseRow>(
      `SELECT id, slug, title, description, primary_language, thumbnail_url, duration_weeks, is_published, created_at, updated_at
       FROM courses WHERE slug = $1`,
      [slug]
    );
    if (result.rows.length === 0) return null;
    return this.rowToCourse(result.rows[0]);
  }

  async findAllGroupedByCategory(): Promise<TrackCategoryResponse[]> {
    const result = await this.pool.query<CourseWithCategoryRow>(
      `SELECT c.id, c.slug, c.title, c.description, c.primary_language, c.thumbnail_url, c.duration_weeks,
              c.is_published, c.created_at, c.updated_at,
              cat.id AS category_id, cat.name AS category_name, cat.slug AS category_slug,
              cat.icon AS category_icon, cat.order_index AS category_order_index
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE c.is_published = true
       ORDER BY cat.order_index ASC NULLS LAST, cat.name ASC NULLS LAST, c.title ASC`
    );

    const map = new Map<string, TrackCategoryResponse>();
    for (const r of result.rows) {
      const key = r.category_id ?? "uncategorised";
      if (!map.has(key)) {
        map.set(key, {
          category: {
            id: r.category_id ?? "uncategorised",
            name: r.category_name ?? "Uncategorised",
            slug: r.category_slug ?? "uncategorised",
            icon: r.category_icon,
            orderIndex: r.category_order_index ?? 0,
          },
          courses: [],
        });
      }
      map.get(key)!.courses.push({
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        primaryLanguage: r.primary_language,
        thumbnailUrl: r.thumbnail_url,
        durationWeeks: r.duration_weeks,
        createdAt: r.created_at.toISOString(),
        updatedAt: r.updated_at.toISOString(),
      });
    }

    return Array.from(map.values());
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
