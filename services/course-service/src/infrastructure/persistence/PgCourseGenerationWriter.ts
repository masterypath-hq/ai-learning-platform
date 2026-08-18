import type { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { CourseOutlineResponse, GenerationModuleStatus, PersistLesson } from "@ai-learning-platform/shared";
import type {
  CourseModuleGenerationStatus,
  ICourseGenerationWriter,
} from "../../application/interfaces/ICourseGenerationWriter.js";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ModuleRow = {
  id: string;
  phase: GenerationModuleStatus["phase"];
  title: string;
  description: string;
  key_concepts: string[];
  duration_weeks: number;
  order_index: number;
  is_published: boolean;
};

/**
 * Checkpointed writer: persists a course outline once (as module rows with is_published=false),
 * then persists each module's lessons independently, flipping that module's is_published to true.
 * A module's is_published therefore doubles as its "lessons generated" checkpoint — nothing else
 * writes module rows for a course outside this generation flow, so the flag is unambiguous.
 */
export class PgCourseGenerationWriter implements ICourseGenerationWriter {
  constructor(private readonly pool: Pool) {}

  async getStatus(courseId: string): Promise<CourseModuleGenerationStatus> {
    const result = await this.pool.query<ModuleRow>(
      `SELECT id, phase, title, description, key_concepts, duration_weeks, order_index, is_published
       FROM modules WHERE course_id = $1 ORDER BY order_index ASC`,
      [courseId]
    );
    const modules: GenerationModuleStatus[] = result.rows.map((row) => ({
      id: row.id,
      phase: row.phase,
      title: row.title,
      description: row.description,
      keyConcepts: row.key_concepts,
      durationWeeks: row.duration_weeks,
      orderIndex: row.order_index,
      lessonsGenerated: row.is_published,
    }));
    return {
      hasOutline: modules.length > 0,
      isFullyGenerated: modules.length > 0 && modules.every((m) => m.lessonsGenerated),
      modules,
    };
  }

  async persistOutline(courseId: string, outline: CourseOutlineResponse): Promise<GenerationModuleStatus[]> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(`SELECT 1 FROM modules WHERE course_id = $1 LIMIT 1`, [courseId]);
      if ((existing.rowCount ?? 0) > 0) {
        throw new Error("OUTLINE_ALREADY_EXISTS");
      }

      await client.query(
        `UPDATE courses SET learning_objectives = $1, prerequisites = $2, updated_at = NOW() WHERE id = $3`,
        [outline.learningObjectives, outline.prerequisites, courseId]
      );

      const modules: GenerationModuleStatus[] = [];
      for (const [orderIndex, mod] of outline.modules.entries()) {
        const moduleId = uuidv4();
        await client.query(
          `INSERT INTO modules (id, course_id, phase, title, description, key_concepts, order_index, duration_weeks, is_published)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
          [moduleId, courseId, mod.phase, mod.title, mod.description, mod.keyConcepts, orderIndex, mod.durationWeeks]
        );
        modules.push({
          id: moduleId,
          phase: mod.phase,
          title: mod.title,
          description: mod.description,
          keyConcepts: mod.keyConcepts,
          durationWeeks: mod.durationWeeks,
          orderIndex,
          lessonsGenerated: false,
        });
      }

      await client.query("COMMIT");
      return modules;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async persistModuleLessons(courseId: string, moduleId: string, lessons: PersistLesson[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const moduleResult = await client.query<{ is_published: boolean }>(
        `SELECT is_published FROM modules WHERE id = $1 AND course_id = $2 FOR UPDATE`,
        [moduleId, courseId]
      );
      if (moduleResult.rowCount === 0) throw new Error("MODULE_NOT_FOUND");
      if (moduleResult.rows[0].is_published) throw new Error("LESSONS_ALREADY_GENERATED");

      for (const [lessonIndex, lesson] of lessons.entries()) {
        const lessonId = uuidv4();
        await client.query(
          `INSERT INTO lessons
             (id, module_id, title, slug, content_type, explanation_content, key_takeaways, duration_mins, order_index, is_published)
           VALUES ($1, $2, $3, $4, 'lesson', $5, $6, $7, $8, true)`,
          [
            lessonId,
            moduleId,
            lesson.title,
            `${slugify(lesson.title)}-${lessonId.slice(0, 8)}`,
            lesson.explanationContent,
            lesson.keyTakeaways,
            lesson.durationMins,
            lessonIndex,
          ]
        );

        for (const [index, example] of lesson.workedExamples.entries()) {
          await client.query(
            `INSERT INTO worked_examples (id, lesson_id, position, title, content, solution)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), lessonId, index + 1, example.title, example.content, example.solution]
          );
        }

        await client.query(
          `INSERT INTO practice_exercises (id, lesson_id, title, prompt, hints, sample_solution)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uuidv4(),
            lessonId,
            lesson.practiceExercise.title,
            lesson.practiceExercise.prompt,
            lesson.practiceExercise.hints,
            lesson.practiceExercise.sampleSolution,
          ]
        );
      }

      await client.query(`UPDATE modules SET is_published = true WHERE id = $1`, [moduleId]);

      // If every module for this course is now generated, the course row's own is_published
      // (already true from seeding — it gates catalog listing, not generation) needs no change;
      // just bump updated_at so consumers can see when generation actually finished.
      const remaining = await client.query(
        `SELECT 1 FROM modules WHERE course_id = $1 AND is_published = false LIMIT 1`,
        [courseId]
      );
      if (remaining.rowCount === 0) {
        await client.query(`UPDATE courses SET updated_at = NOW() WHERE id = $1`, [courseId]);
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async clearGeneratedContent(courseId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM modules WHERE course_id = $1`, [courseId]);
      await client.query(
        `UPDATE courses SET learning_objectives = '{}', prerequisites = '{}', updated_at = NOW() WHERE id = $1`,
        [courseId]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
