export interface IMarkLessonViewedAction {
  execute(userId: string, courseId: string, lessonId: string): Promise<void>;
}
