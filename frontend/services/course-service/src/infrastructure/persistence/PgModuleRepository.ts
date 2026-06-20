import type { Pool } from "pg";
import { Module } from "../../domain/models/Module.js";
import type { IModuleRepository } from "../../application/interfaces/IModuleRepository.js";

type ModuleRow = {
  id: string;
  course_id: string;
  position: number;
  theme: string;
  key_concepts: string[] | null;
  estimated_duration_minutes: number | null;
  created_at: Date;
  updated_at: Date;
};

export class PgModuleRepository implements IModuleRepository {
  constructor(private readonly pool: Pool) {}

  async saveAll(modules: Module[]): Promise<void> {
    if (modules.length === 0) return;

    // Build multi-row INSERT with parameterised placeholders
    const cols = "id, course_id, position, theme, key_concepts, estimated_duration_minutes, created_at, updated_at";
    const FIELDS_PER_ROW = 8;
    const placeholders = modules
      .map((_, i) => {
        const base = i * FIELDS_PER_ROW;
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
      })
      .join(", ");

    const values = modules.flatMap((m) => {
      const p = m.toJSON();
      return [p.id, p.courseId, p.position, p.theme, p.keyConcepts, p.estimatedDurationMinutes, p.createdAt, p.updatedAt];
    });

    await this.pool.query(
      `INSERT INTO modules (${cols}) VALUES ${placeholders}
       ON CONFLICT (course_id, position) DO NOTHING`,
      values
    );
  }

  async findByCourseId(courseId: string): Promise<Module[]> {
    const result = await this.pool.query<ModuleRow>(
      `SELECT id, course_id, position, theme, key_concepts, estimated_duration_minutes, created_at, updated_at
       FROM modules WHERE course_id = $1 ORDER BY position ASC`,
      [courseId]
    );
    return result.rows.map((r) => this.rowToModule(r));
  }

  private rowToModule(row: ModuleRow): Module {
    return Module.create({
      id: row.id,
      courseId: row.course_id,
      position: row.position,
      theme: row.theme,
      keyConcepts: row.key_concepts ?? [],
      estimatedDurationMinutes: row.estimated_duration_minutes ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
