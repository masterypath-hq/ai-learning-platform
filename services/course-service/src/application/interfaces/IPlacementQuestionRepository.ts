import type { PhaseLevel, PlacementQuestionResponse } from "@ai-learning-platform/shared";

export interface PlacementQuestion extends PlacementQuestionResponse {
  correctOption: string;
  phaseIfCorrect: PhaseLevel;
  phaseIfWrong: PhaseLevel;
}

export interface IPlacementQuestionRepository {
  findByCourseAndLevel(courseId: string, level: PhaseLevel): Promise<PlacementQuestion | null>;
  findById(id: string): Promise<PlacementQuestion | null>;
}
