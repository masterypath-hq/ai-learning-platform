import type { SkillResponse } from "@ai-learning-platform/shared";

export type Skill = SkillResponse;

export interface ISkillRepository {
  findByCourseId(courseId: string): Promise<Skill[]>;
  findById(id: string): Promise<Skill | null>;
}
