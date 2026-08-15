import type { Pool } from "pg";
import type { GradedQuizType, QuestionFeedback, QuizAnswer, QuizQuestion } from "@ai-learning-platform/shared";
import { QuizAttempt } from "../../domain/models/QuizAttempt.js";
import type {
  CreateQuizAttemptParams,
  IQuizAttemptRepository,
  SubmitQuizAttemptParams,
} from "../../application/interfaces/IQuizAttemptRepository.js";

type QuizAttemptRow = {
  id: string;
  user_id: string;
  course_id: string;
  module_id: string | null;
  type: string;
  scope_id: string;
  status: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[] | null;
  score: number | null;
  passed: boolean | null;
  feedback: QuestionFeedback[] | null;
  started_at: Date;
  submitted_at: Date | null;
};

const SELECT_COLUMNS = `id, user_id, course_id, module_id, type, scope_id, status, questions, answers, score, passed, feedback, started_at, submitted_at`;

export class PgQuizAttemptRepository implements IQuizAttemptRepository {
  constructor(private readonly pool: Pool) {}

  async create(params: CreateQuizAttemptParams): Promise<QuizAttempt> {
    try {
      const result = await this.pool.query<QuizAttemptRow>(
        `INSERT INTO quiz_attempts (user_id, course_id, module_id, type, scope_id, questions)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${SELECT_COLUMNS}`,
        [params.userId, params.courseId, params.moduleId, params.type, params.scopeId, JSON.stringify(params.questions)]
      );
      return this.rowToQuizAttempt(result.rows[0]);
    } catch (err) {
      // uq_quiz_attempts_in_progress: a concurrent request already created the in-progress
      // attempt for this (user, type, scope) between our findInProgress check and this insert.
      if (err && typeof err === "object" && "code" in err && err.code === "23505") {
        const existing = await this.findInProgress(params.userId, params.type, params.scopeId);
        if (existing) return existing;
      }
      throw err;
    }
  }

  async findById(id: string): Promise<QuizAttempt | null> {
    const result = await this.pool.query<QuizAttemptRow>(`SELECT ${SELECT_COLUMNS} FROM quiz_attempts WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return this.rowToQuizAttempt(result.rows[0]);
  }

  async findInProgress(userId: string, type: GradedQuizType, scopeId: string): Promise<QuizAttempt | null> {
    const result = await this.pool.query<QuizAttemptRow>(
      `SELECT ${SELECT_COLUMNS} FROM quiz_attempts
       WHERE user_id = $1 AND type = $2 AND scope_id = $3 AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
      [userId, type, scopeId]
    );
    if (result.rows.length === 0) return null;
    return this.rowToQuizAttempt(result.rows[0]);
  }

  async findLatestFailed(userId: string, type: GradedQuizType, scopeId: string): Promise<QuizAttempt | null> {
    const result = await this.pool.query<QuizAttemptRow>(
      `SELECT ${SELECT_COLUMNS} FROM quiz_attempts
       WHERE user_id = $1 AND type = $2 AND scope_id = $3 AND status = 'submitted' AND passed = false
       ORDER BY submitted_at DESC LIMIT 1`,
      [userId, type, scopeId]
    );
    if (result.rows.length === 0) return null;
    return this.rowToQuizAttempt(result.rows[0]);
  }

  async submit(id: string, params: SubmitQuizAttemptParams): Promise<QuizAttempt> {
    const result = await this.pool.query<QuizAttemptRow>(
      `UPDATE quiz_attempts
       SET status = 'submitted', answers = $2, score = $3, passed = $4, feedback = $5, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [id, JSON.stringify(params.answers), params.score, params.passed, JSON.stringify(params.feedback)]
    );
    if (result.rows.length === 0) throw new Error("ATTEMPT_NOT_FOUND");
    return this.rowToQuizAttempt(result.rows[0]);
  }

  async findByCourseId(userId: string, courseId: string): Promise<QuizAttempt[]> {
    const result = await this.pool.query<QuizAttemptRow>(
      `SELECT ${SELECT_COLUMNS} FROM quiz_attempts WHERE user_id = $1 AND course_id = $2 ORDER BY started_at DESC`,
      [userId, courseId]
    );
    return result.rows.map((r) => this.rowToQuizAttempt(r));
  }

  async findRecentByUserId(userId: string, limit: number): Promise<QuizAttempt[]> {
    const result = await this.pool.query<QuizAttemptRow>(
      `SELECT ${SELECT_COLUMNS} FROM quiz_attempts
       WHERE user_id = $1 AND status = 'submitted'
       ORDER BY submitted_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map((r) => this.rowToQuizAttempt(r));
  }

  private rowToQuizAttempt(row: QuizAttemptRow): QuizAttempt {
    return QuizAttempt.create({
      id: row.id,
      userId: row.user_id,
      courseId: row.course_id,
      moduleId: row.module_id,
      type: row.type as GradedQuizType,
      scopeId: row.scope_id,
      status: row.status as "in_progress" | "submitted",
      questions: row.questions,
      answers: row.answers,
      score: row.score,
      passed: row.passed,
      feedback: row.feedback,
      startedAt: row.started_at,
      submittedAt: row.submitted_at,
    });
  }
}
