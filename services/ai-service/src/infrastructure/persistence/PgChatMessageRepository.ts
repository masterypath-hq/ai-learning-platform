import type { Pool } from "pg";
import { ChatMessage } from "../../domain/models/ChatMessage.js";
import type { IChatMessageRepository } from "../../application/interfaces/IChatMessageRepository.js";
import type { ChatMessageRole } from "@ai-learning-platform/shared";

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: Date;
};

const SELECT_COLUMNS = `id, session_id, role, content, created_at`;

export class PgChatMessageRepository implements IChatMessageRepository {
  constructor(private readonly pool: Pool) {}

  async create(params: { sessionId: string; role: ChatMessageRole; content: string }): Promise<ChatMessage> {
    const result = await this.pool.query<ChatMessageRow>(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, $2, $3)
       RETURNING ${SELECT_COLUMNS}`,
      [params.sessionId, params.role, params.content]
    );
    return this.rowToChatMessage(result.rows[0]);
  }

  async findBySessionId(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    const result = await this.pool.query<ChatMessageRow>(
      `SELECT ${SELECT_COLUMNS} FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       ${typeof limit === "number" ? "LIMIT $2" : ""}`,
      typeof limit === "number" ? [sessionId, limit] : [sessionId]
    );
    return result.rows.map((row) => this.rowToChatMessage(row));
  }

  private rowToChatMessage(row: ChatMessageRow): ChatMessage {
    return ChatMessage.create({
      id: row.id,
      sessionId: row.session_id,
      role: row.role as ChatMessageRole,
      content: row.content,
      createdAt: row.created_at,
    });
  }
}
