import type { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { PersistCourseContentRequest } from "@ai-learning-platform/shared";
import type { ICourseContentWriter } from "../../application/interfaces/ICourseContentWriter.js";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Replaces a course's entire module/lesson tree in one transaction. Idempotent —
 * safe to re-run generation for the same course (old modules cascade-delete their
 * lessons, worked examples, and practice exercises before the new tree is inserted).
 */
export class PgCourseContentWriter implements ICourseContentWriter {
  constructor(private readonly pool: Pool) {}

  async replaceContent(courseId: string, content: PersistCourseContentRequest): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE courses SET learning_objectives = $1, prerequisites = $2, is_published = true, updated_at = NOW()
         WHERE id = $3`,
        [content.learningObjectives, content.prerequisites, courseId]
      );

      await client.query(`DELETE FROM modules WHERE course_id = $1`, [courseId]);

      for (const mod of content.modules) {
        const moduleId = uuidv4();
        await client.query(
          `INSERT INTO modules (id, course_id, phase, title, description, key_concepts, order_index, duration_weeks, is_published)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
          [moduleId, courseId, mod.phase, mod.title, mod.description, mod.keyConcepts, mod.orderIndex, mod.durationWeeks]
        );

        for (const lesson of mod.lessons) {
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
              lesson.orderIndex,
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
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
