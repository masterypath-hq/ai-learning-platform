import type { Pool } from "pg";
import { Module } from "../../domain/models/Module.js";
import type { IModuleRepository } from "../../application/interfaces/IModuleRepository.js";
import type { PhaseLevel } from "@ai-learning-platform/shared";

type ModuleRow = {
  id: string;
  course_id: string;
  phase: string;
  title: string;
  description: string | null;
  key_concepts: string[] | null;
  order_index: number;
  duration_weeks: number | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
};

export class PgModuleRepository implements IModuleRepository {
  constructor(private readonly pool: Pool) {}

  async findByCourseId(courseId: string): Promise<Module[]> {
    const result = await this.pool.query<ModuleRow>(
      `SELECT id, course_id, phase, title, description, key_concepts, order_index, duration_weeks, is_published, created_at, updated_at
       FROM modules WHERE course_id = $1 ORDER BY order_index ASC`,
      [courseId]
    );
    return result.rows.map((r) => this.rowToModule(r));
  }

  async findById(id: string): Promise<Module | null> {
    const result = await this.pool.query<ModuleRow>(
      `SELECT id, course_id, phase, title, description, key_concepts, order_index, duration_weeks, is_published, created_at, updated_at
       FROM modules WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.rowToModule(result.rows[0]);
  }

  private rowToModule(row: ModuleRow): Module {
    return Module.create({
      id: row.id,
      courseId: row.course_id,
      phase: row.phase as PhaseLevel,
      title: row.title,
      description: row.description,
      keyConcepts: row.key_concepts ?? [],
      orderIndex: row.order_index,
      durationWeeks: row.duration_weeks,
      isPublished: row.is_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
