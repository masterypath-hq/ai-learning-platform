import type { ConfidenceLevel, UserSkillConfidenceResponse } from "@ai-learning-platform/shared";

export interface SkillConfidenceRating {
  skillId: string;
  level: ConfidenceLevel;
}

export interface IUserSkillConfidenceRepository {
  findByUserId(userId: string): Promise<UserSkillConfidenceResponse[]>;
  upsertMany(userId: string, ratings: SkillConfidenceRating[]): Promise<UserSkillConfidenceResponse[]>;
}
