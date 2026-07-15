import type { Pool } from "pg";
import type { ICategoryRepository, Category } from "../../application/interfaces/ICategoryRepository.js";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order_index: number;
};

const SELECT = `SELECT id, name, slug, icon, order_index FROM categories`;

function rowToCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    icon: r.icon,
    orderIndex: r.order_index,
  };
}

export class PgCategoryRepository implements ICategoryRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Category[]> {
    const result = await this.pool.query<CategoryRow>(`${SELECT} ORDER BY order_index ASC, name ASC`);
    return result.rows.map(rowToCategory);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const result = await this.pool.query<CategoryRow>(`${SELECT} WHERE slug = $1`, [slug]);
    if (result.rows.length === 0) return null;
    return rowToCategory(result.rows[0]);
  }
}
