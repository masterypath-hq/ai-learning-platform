import type { Pool } from "pg";
import { Lesson } from "../../domain/models/Lesson.js";
import { WorkedExample } from "../../domain/models/WorkedExample.js";
import { PracticeExercise } from "../../domain/models/PracticeExercise.js";
import type { ILessonRepository, LessonBundle, LessonWithContent } from "../../application/interfaces/ILessonRepository.js";

type LessonRow = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  content_url: string | null;
  content_type: string;
  explanation_content: string | null;
  key_takeaways: string[] | null;
  duration_mins: number | null;
  order_index: number;
  is_published: boolean;
  is_project: boolean;
  project_github_required: boolean;
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

  async findByModuleId(moduleId: string): Promise<LessonBundle> {
    const lessonResult = await this.pool.query<LessonRow>(
      `SELECT id, module_id, slug, title, content_url, content_type, explanation_content, key_takeaways, duration_mins,
              order_index, is_published, is_project, project_github_required, created_at, updated_at
       FROM lessons WHERE module_id = $1 ORDER BY order_index ASC`,
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

  async findById(id: string): Promise<LessonWithContent | null> {
    const lessonResult = await this.pool.query<LessonRow>(
      `SELECT id, module_id, slug, title, content_url, content_type, explanation_content, key_takeaways, duration_mins,
              order_index, is_published, is_project, project_github_required, created_at, updated_at
       FROM lessons WHERE id = $1`,
      [id]
    );
    if (lessonResult.rows.length === 0) return null;
    const lesson = this.rowToLesson(lessonResult.rows[0]);

    const weResult = await this.pool.query<WorkedExampleRow>(
      `SELECT id, lesson_id, position, title, content, solution, created_at
       FROM worked_examples WHERE lesson_id = $1 ORDER BY position ASC`,
      [id]
    );
    const peResult = await this.pool.query<PracticeExerciseRow>(
      `SELECT id, lesson_id, title, prompt, hints, sample_solution, created_at
       FROM practice_exercises WHERE lesson_id = $1`,
      [id]
    );

    return {
      lesson,
      workedExamples: weResult.rows.map((r) => this.rowToWorkedExample(r)),
      practiceExercise: peResult.rows.length > 0 ? this.rowToPracticeExercise(peResult.rows[0]) : null,
    };
  }

  private rowToLesson(row: LessonRow): Lesson {
    return Lesson.create({
      id: row.id,
      moduleId: row.module_id,
      slug: row.slug,
      title: row.title,
      contentUrl: row.content_url,
      contentType: row.content_type,
      explanationContent: row.explanation_content,
      keyTakeaways: row.key_takeaways ?? [],
      durationMins: row.duration_mins,
      orderIndex: row.order_index,
      isPublished: row.is_published,
      isProject: row.is_project,
      projectGithubRequired: row.project_github_required,
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
