import type { Pool, PoolClient } from "pg";
import { Lesson } from "../../domain/models/Lesson.js";
import { WorkedExample } from "../../domain/models/WorkedExample.js";
import { PracticeExercise } from "../../domain/models/PracticeExercise.js";
import type { ILessonRepository, LessonBundle } from "../../application/interfaces/ILessonRepository.js";

type LessonRow = {
  id: string;
  module_id: string;
  position: number;
  title: string;
  explanation_content: string | null;
  key_takeaways: string[] | null;
  estimated_duration_minutes: number | null;
  created_at: Date;
  updated_at: Date;
};

type WorkedExampleRow = {
  id: string;
  lesson_id: string;
  position: number;
  title: string;
  content: string;
  solution: string;
  created_at: Date;
};

type PracticeExerciseRow = {
  id: string;
  lesson_id: string;
  title: string;
  prompt: string;
  hints: string[] | null;
  sample_solution: string;
  created_at: Date;
};

export class PgLessonRepository implements ILessonRepository {
  constructor(private readonly pool: Pool) {}

  /** Saves lessons, worked examples, and practice exercises in a single transaction. */
  async saveAll(
    lessons: Lesson[],
    workedExamples: WorkedExample[],
    practiceExercises: PracticeExercise[]
  ): Promise<void> {
    if (lessons.length === 0) return;

    const client: PoolClient = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Insert lessons (multi-row)
      const LESSON_FIELDS = 9;
      const lessonPlaceholders = lessons
        .map((_, i) => {
          const b = i * LESSON_FIELDS;
          return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9})`;
        })
        .join(", ");
      const lessonValues = lessons.flatMap((l) => {
        const p = l.toJSON();
        return [p.id, p.moduleId, p.position, p.title, p.explanationContent, p.keyTakeaways, p.estimatedDurationMinutes, p.createdAt, p.updatedAt];
      });
      await client.query(
        `INSERT INTO lessons
           (id, module_id, position, title, explanation_content, key_takeaways, estimated_duration_minutes, created_at, updated_at)
         VALUES ${lessonPlaceholders}
         ON CONFLICT (module_id, position) DO NOTHING`,
        lessonValues
      );

      // Insert worked examples (multi-row)
      if (workedExamples.length > 0) {
        const WE_FIELDS = 7;
        const wePlaceholders = workedExamples
          .map((_, i) => {
            const b = i * WE_FIELDS;
            return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7})`;
          })
          .join(", ");
        const weValues = workedExamples.flatMap((we) => {
          const p = we.toJSON();
          return [p.id, p.lessonId, p.position, p.title, p.content, p.solution, p.createdAt];
        });
        await client.query(
          `INSERT INTO worked_examples (id, lesson_id, position, title, content, solution, created_at)
           VALUES ${wePlaceholders}
           ON CONFLICT (lesson_id, position) DO NOTHING`,
          weValues
        );
      }

      // Insert practice exercises (multi-row)
      if (practiceExercises.length > 0) {
        const PE_FIELDS = 6;
        const pePlaceholders = practiceExercises
          .map((_, i) => {
            const b = i * PE_FIELDS;
            return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6})`;
          })
          .join(", ");
        const peValues = practiceExercises.flatMap((pe) => {
          const p = pe.toJSON();
          return [p.id, p.lessonId, p.title, p.prompt, p.hints, p.sampleSolution];
        });
        await client.query(
          `INSERT INTO practice_exercises (id, lesson_id, title, prompt, hints, sample_solution)
           VALUES ${pePlaceholders}
           ON CONFLICT (lesson_id) DO NOTHING`,
          peValues
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findByModuleId(moduleId: string): Promise<LessonBundle> {
    const lessonResult = await this.pool.query<LessonRow>(
      `SELECT id, module_id, position, title, explanation_content, key_takeaways, estimated_duration_minutes, created_at, updated_at
       FROM lessons WHERE module_id = $1 ORDER BY position ASC`,
      [moduleId]
    );
    const lessons = lessonResult.rows.map((r) => this.rowToLesson(r));

    if (lessons.length === 0) {
      return { lessons: [], workedExamples: [], practiceExercises: [] };
    }

    const lessonIds = lessons.map((l) => l.id);

    const weResult = await this.pool.query<WorkedExampleRow>(
      `SELECT id, lesson_id, position, title, content, solution, created_at
       FROM worked_examples WHERE lesson_id = ANY($1) ORDER BY lesson_id, position ASC`,
      [lessonIds]
    );

    const peResult = await this.pool.query<PracticeExerciseRow>(
      `SELECT id, lesson_id, title, prompt, hints, sample_solution, created_at
       FROM practice_exercises WHERE lesson_id = ANY($1)`,
      [lessonIds]
    );

    return {
      lessons,
      workedExamples: weResult.rows.map((r) => this.rowToWorkedExample(r)),
      practiceExercises: peResult.rows.map((r) => this.rowToPracticeExercise(r)),
    };
  }

  private rowToLesson(row: LessonRow): Lesson {
    return Lesson.create({
      id: row.id,
      moduleId: row.module_id,
      position: row.position,
      title: row.title,
      explanationContent: row.explanation_content ?? "",
      keyTakeaways: row.key_takeaways ?? [],
      estimatedDurationMinutes: row.estimated_duration_minutes ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  private rowToWorkedExample(row: WorkedExampleRow): WorkedExample {
    return WorkedExample.create({
      id: row.id,
      lessonId: row.lesson_id,
      position: row.position,
      title: row.title,
      content: row.content,
      solution: row.solution,
      createdAt: row.created_at,
    });
  }

  private rowToPracticeExercise(row: PracticeExerciseRow): PracticeExercise {
    return PracticeExercise.create({
      id: row.id,
      lessonId: row.lesson_id,
      title: row.title,
      prompt: row.prompt,
      hints: row.hints ?? [],
      sampleSolution: row.sample_solution,
      createdAt: row.created_at,
    });
  }
}
