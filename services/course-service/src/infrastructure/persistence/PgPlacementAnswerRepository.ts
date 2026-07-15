import type { Pool } from "pg";
import type {
  IPlacementAnswerRepository,
  PlacementAnswer,
} from "../../application/interfaces/IPlacementAnswerRepository.js";

type AnswerRow = {
  user_id: string;
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  answered_at: Date;
};

const SELECT = `SELECT user_id, question_id, selected_option, is_correct, answered_at FROM placement_answers`;

function rowToAnswer(r: AnswerRow): PlacementAnswer {
  return {
    userId: r.user_id,
    questionId: r.question_id,
    selectedOption: r.selected_option,
    isCorrect: r.is_correct,
    answeredAt: r.answered_at.toISOString(),
  };
}

export class PgPlacementAnswerRepository implements IPlacementAnswerRepository {
  constructor(private readonly pool: Pool) {}

  async record(userId: string, questionId: string, selectedOption: string, isCorrect: boolean): Promise<PlacementAnswer> {
    const result = await this.pool.query<AnswerRow>(
      `INSERT INTO placement_answers (user_id, question_id, selected_option, is_correct)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, question_id)
         DO UPDATE SET selected_option = EXCLUDED.selected_option, is_correct = EXCLUDED.is_correct, answered_at = NOW()
       RETURNING user_id, question_id, selected_option, is_correct, answered_at`,
      [userId, questionId, selectedOption, isCorrect]
    );
    return rowToAnswer(result.rows[0]);
  }

  async findByUserAndQuestion(userId: string, questionId: string): Promise<PlacementAnswer | null> {
    const result = await this.pool.query<AnswerRow>(
      `${SELECT} WHERE user_id = $1 AND question_id = $2`,
      [userId, questionId]
    );
    if (result.rows.length === 0) return null;
    return rowToAnswer(result.rows[0]);
  }
}
