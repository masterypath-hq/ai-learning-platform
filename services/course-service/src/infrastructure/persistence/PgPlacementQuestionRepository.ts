import type { Pool } from "pg";
import type { PhaseLevel, PlacementQuestionOptions } from "@ai-learning-platform/shared";
import type { IPlacementQuestionRepository, PlacementQuestion } from "../../application/interfaces/IPlacementQuestionRepository.js";

type QuestionRow = {
  id: string;
  question: string;
  options: PlacementQuestionOptions;
  correct_option: string;
  phase_if_correct: string;
  phase_if_wrong: string;
  code_snippet: string | null;
  code_language: string | null;
  skill_id: string | null;
};

const SELECT = `
  SELECT id, question, options, correct_option, phase_if_correct, phase_if_wrong,
         code_snippet, code_language, skill_id
  FROM placement_questions
`;

function rowToQuestion(r: QuestionRow): PlacementQuestion {
  return {
    id: r.id,
    question: r.question,
    options: r.options,
    correctOption: r.correct_option,
    phaseIfCorrect: r.phase_if_correct as PhaseLevel,
    phaseIfWrong: r.phase_if_wrong as PhaseLevel,
    codeSnippet: r.code_snippet,
    codeLanguage: r.code_language,
    skillId: r.skill_id,
  };
}

export class PgPlacementQuestionRepository implements IPlacementQuestionRepository {
  constructor(private readonly pool: Pool) {}

  async findByCourseAndLevel(courseId: string, level: PhaseLevel): Promise<PlacementQuestion | null> {
    const result = await this.pool.query<QuestionRow>(
      `${SELECT} WHERE course_id = $1 AND level = $2`,
      [courseId, level]
    );
    if (result.rows.length === 0) return null;
    return rowToQuestion(result.rows[0]);
  }

  async findById(id: string): Promise<PlacementQuestion | null> {
    const result = await this.pool.query<QuestionRow>(
      `${SELECT} WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return rowToQuestion(result.rows[0]);
  }
}
