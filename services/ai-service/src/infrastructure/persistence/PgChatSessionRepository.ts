import type { Pool } from "pg";
import { ChatSession } from "../../domain/models/ChatSession.js";
import type { IChatSessionRepository } from "../../application/interfaces/IChatSessionRepository.js";
import type { ChatSubjectArea } from "@ai-learning-platform/shared";

type ChatSessionRow = {
  id: string;
  user_id: string;
  subject_area: string;
  track: string;
  topic: string | null;
  summary: string | null;
  suggested_next_questions: string[];
  created_at: Date;
  closed_at: Date | null;
};

const SELECT_COLUMNS = `id, user_id, subject_area, track, topic, summary, suggested_next_questions, created_at, closed_at`;

export class PgChatSessionRepository implements IChatSessionRepository {
  constructor(private readonly pool: Pool) {}

  async create(params: {
    userId: string;
    subjectArea: ChatSubjectArea;
    track: string;
    topic: string | null;
  }): Promise<ChatSession> {
    const result = await this.pool.query<ChatSessionRow>(
      `INSERT INTO chat_sessions (user_id, subject_area, track, topic)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SELECT_COLUMNS}`,
      [params.userId, params.subjectArea, params.track, params.topic]
    );
    return this.rowToChatSession(result.rows[0]);
  }

  async findById(id: string): Promise<ChatSession | null> {
    const result = await this.pool.query<ChatSessionRow>(
      `SELECT ${SELECT_COLUMNS} FROM chat_sessions WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.rowToChatSession(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<ChatSession[]> {
    const result = await this.pool.query<ChatSessionRow>(
      `SELECT ${SELECT_COLUMNS} FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map((r) => this.rowToChatSession(r));
  }

  async close(id: string, summary: string, suggestedNextQuestions: string[]): Promise<ChatSession> {
    const result = await this.pool.query<ChatSessionRow>(
      `UPDATE chat_sessions
       SET summary = $2, suggested_next_questions = $3, closed_at = NOW()
       WHERE id = $1
       RETURNING ${SELECT_COLUMNS}`,
      [id, summary, suggestedNextQuestions]
    );
    if (result.rows.length === 0) throw new Error("SESSION_NOT_FOUND");
    return this.rowToChatSession(result.rows[0]);
  }

  private rowToChatSession(row: ChatSessionRow): ChatSession {
    return ChatSession.create({
      id: row.id,
      userId: row.user_id,
      subjectArea: row.subject_area as ChatSubjectArea,
      track: row.track,
      topic: row.topic,
      summary: row.summary,
      suggestedNextQuestions: row.suggested_next_questions,
      createdAt: row.created_at,
      closedAt: row.closed_at,
    });
  }
}
