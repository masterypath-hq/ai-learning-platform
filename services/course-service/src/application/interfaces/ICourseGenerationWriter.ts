import type { CourseOutlineResponse, GenerationModuleStatus, PersistLesson } from "@ai-learning-platform/shared";

/** Module-level generation status — course-level fields (id/slug/title) are the caller's
 * responsibility since they already come from ICourseRepository. */
export type CourseModuleGenerationStatus = {
  hasOutline: boolean;
  isFullyGenerated: boolean;
  modules: GenerationModuleStatus[];
};

/**
 * Checkpointed counterpart to ICourseContentWriter: persists a course's generated content
 * incrementally (outline once, then lessons per module) so a failed run keeps everything
 * generated before the failure, and a re-run skips whatever is already saved.
 *
 * Module identity across calls is the DB row id returned by persistOutline — the outline is
 * generated once and reused, so titles never shift under a resumed run.
 */
export interface ICourseGenerationWriter {
  getStatus(courseId: string): Promise<CourseModuleGenerationStatus>;

  /** Throws OUTLINE_ALREADY_EXISTS if this course already has module rows. */
  persistOutline(courseId: string, outline: CourseOutlineResponse): Promise<GenerationModuleStatus[]>;

  /** Throws MODULE_NOT_FOUND if moduleId doesn't belong to courseId, or
   * LESSONS_ALREADY_GENERATED if that module's lessons were already persisted. */
  persistModuleLessons(courseId: string, moduleId: string, lessons: PersistLesson[]): Promise<void>;

  /** Deletes all modules/lessons for the course (cascades) and clears course-level outline
   * fields, so a subsequent run starts a fresh generation. Used by --force. */
  clearGeneratedContent(courseId: string): Promise<void>;
}
