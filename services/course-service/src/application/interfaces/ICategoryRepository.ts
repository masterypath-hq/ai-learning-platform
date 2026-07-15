import type { CategoryResponse } from "@ai-learning-platform/shared";

export type Category = CategoryResponse;

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
}
