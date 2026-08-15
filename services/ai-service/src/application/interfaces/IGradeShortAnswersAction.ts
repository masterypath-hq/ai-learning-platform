import type { GradeShortAnswersRequest, GradeShortAnswersResponse } from "@ai-learning-platform/shared";

export interface IGradeShortAnswersAction {
  execute(request: GradeShortAnswersRequest): Promise<GradeShortAnswersResponse>;
}
