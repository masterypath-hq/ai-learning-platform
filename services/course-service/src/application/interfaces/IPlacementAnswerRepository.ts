export interface PlacementAnswer {
  userId: string;
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface IPlacementAnswerRepository {
  record(userId: string, questionId: string, selectedOption: string, isCorrect: boolean): Promise<PlacementAnswer>;
  findByUserAndQuestion(userId: string, questionId: string): Promise<PlacementAnswer | null>;
}
