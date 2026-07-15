import type { Pool } from "pg";
import type { ISkillRepository, Skill } from "../../application/interfaces/ISkillRepository.js";

type SkillRow = {
  id: string;
  course_id: string;
  name: string;
  icon: string | null;
  order_index: number;
};

const SELECT = `SELECT id, course_id, name, icon, order_index FROM skills`;

function rowToSkill(r: SkillRow): Skill {
  return {
    id: r.id,
    courseId: r.course_id,
    name: r.name,
    icon: r.icon,
    orderIndex: r.order_index,
  };
}

export class PgSkillRepository implements ISkillRepository {
  constructor(private readonly pool: Pool) {}

  async findByCourseId(courseId: string): Promise<Skill[]> {
    const result = await this.pool.query<SkillRow>(
      `${SELECT} WHERE course_id = $1 ORDER BY order_index ASC, name ASC`,
      [courseId]
    );
    return result.rows.map(rowToSkill);
  }

  async findById(id: string): Promise<Skill | null> {
    const result = await this.pool.query<SkillRow>(`${SELECT} WHERE id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return rowToSkill(result.rows[0]);
  }
}
