import { Course } from "../../domain/models/Course.js";
import { Module } from "../../domain/models/Module.js";
import { Lesson } from "../../domain/models/Lesson.js";
import { WorkedExample } from "../../domain/models/WorkedExample.js";
import { PracticeExercise } from "../../domain/models/PracticeExercise.js";
import type { ICourseRepository } from "../interfaces/ICourseRepository.js";
import type { IModuleRepository } from "../interfaces/IModuleRepository.js";
import type { ILessonRepository } from "../interfaces/ILessonRepository.js";
import type { IAIContentGenerator } from "../interfaces/IAIContentGenerator.js";
import type { IEventPublisher } from "../interfaces/IEventPublisher.js";
import type { IGenerateCourseAction } from "../interfaces/IGenerateCourseAction.js";
import { CourseStatus, COURSE_EVENTS } from "@ai-learning-platform/shared";
import type { GenerateCourseRequest, GenerateCourseResponse } from "@ai-learning-platform/shared";
import { v4 as uuidv4 } from "uuid";

/**
 * Saves course as GENERATING, returns courseId immediately, then generates content
 * in a fire-and-forget background Promise. (SOLID: S — single responsibility.)
 */
export class GenerateCourseAction implements IGenerateCourseAction {
  constructor(
    private readonly courseRepo: ICourseRepository,
    private readonly moduleRepo: IModuleRepository,
    private readonly lessonRepo: ILessonRepository,
    private readonly aiGenerator: IAIContentGenerator,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(userId: string, request: GenerateCourseRequest): Promise<GenerateCourseResponse> {
    const now = new Date();
    const course = Course.create({
      id: uuidv4(),
      userId,
      subject: request.subject,
      track: request.track,
      level: request.level,
      title: null,
      description: null,
      learningObjectives: [],
      prerequisites: [],
      estimatedDurationMinutes: null,
      status: CourseStatus.GENERATING,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.courseRepo.save(course);

    await this.eventPublisher.publish({
      type: COURSE_EVENTS.COURSE_GENERATION_STARTED,
      payload: {
        courseId: course.id,
        userId,
        subject: request.subject,
        track: request.track,
        level: request.level,
        startedAt: now.toISOString(),
      },
      occurredAt: now.toISOString(),
    });

    // Fire-and-forget: generate content in background
    this.runBackgroundGeneration(course.id, userId, request).catch((err) => {
      console.error(`[GenerateCourseAction] Unhandled error in background generation for course ${course.id}:`, err);
    });

    return { courseId: course.id, status: CourseStatus.GENERATING };
  }

  private async runBackgroundGeneration(
    courseId: string,
    userId: string,
    request: GenerateCourseRequest
  ): Promise<void> {
    try {
      // Phase 1: Generate course outline and save modules
      const outline = await this.aiGenerator.generateCourseOutline({
        subject: request.subject,
        track: request.track,
        level: request.level,
        userBackground: request.userBackground,
      });

      await this.courseRepo.updateDetails(courseId, {
        title: outline.title,
        description: outline.description,
        learningObjectives: outline.learningObjectives,
        prerequisites: outline.prerequisites,
        estimatedDurationMinutes: outline.estimatedDurationMinutes,
      });

      const now = new Date();
      const modules = outline.modules.map((m, index) =>
        Module.create({
          id: uuidv4(),
          courseId,
          position: index + 1,
          theme: m.theme,
          keyConcepts: m.keyConcepts,
          estimatedDurationMinutes: m.estimatedDurationMinutes,
          createdAt: now,
          updatedAt: now,
        })
      );

      await this.moduleRepo.saveAll(modules);

      // Phase 2: Generate lessons for each module sequentially
      for (const mod of modules) {
        const result = await this.aiGenerator.generateModuleLessons({
          subject: request.subject,
          track: request.track,
          level: request.level,
          moduleTheme: mod.theme,
          keyConcepts: mod.keyConcepts,
        });

        const lessonNow = new Date();
        const lessons: Lesson[] = [];
        const workedExamples: WorkedExample[] = [];
        const practiceExercises: PracticeExercise[] = [];

        result.lessons.forEach((lessonData, lessonIndex) => {
          const lessonId = uuidv4();
          const lesson = Lesson.create({
            id: lessonId,
            moduleId: mod.id,
            position: lessonIndex + 1,
            title: lessonData.title,
            explanationContent: lessonData.explanationContent,
            keyTakeaways: lessonData.keyTakeaways,
            estimatedDurationMinutes: lessonData.estimatedDurationMinutes,
            createdAt: lessonNow,
            updatedAt: lessonNow,
          });
          lessons.push(lesson);

          lessonData.workedExamples.forEach((we, weIndex) => {
            workedExamples.push(
              WorkedExample.create({
                id: uuidv4(),
                lessonId,
                position: weIndex + 1,
                title: we.title,
                content: we.content,
                solution: we.solution,
                createdAt: lessonNow,
              })
            );
          });

          practiceExercises.push(
            PracticeExercise.create({
              id: uuidv4(),
              lessonId,
              title: lessonData.practiceExercise.title,
              prompt: lessonData.practiceExercise.prompt,
              hints: lessonData.practiceExercise.hints,
              sampleSolution: lessonData.practiceExercise.sampleSolution,
              createdAt: lessonNow,
            })
          );
        });

        await this.lessonRepo.saveAll(lessons, workedExamples, practiceExercises);
      }

      await this.courseRepo.updateStatus(courseId, CourseStatus.READY);

      const readyAt = new Date().toISOString();
      await this.eventPublisher.publish({
        type: COURSE_EVENTS.COURSE_READY,
        payload: { courseId, userId, title: outline.title, readyAt },
        occurredAt: readyAt,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown generation error";
      console.error(`[GenerateCourseAction] Course generation failed for ${courseId}:`, err);
      await this.courseRepo.updateStatus(courseId, CourseStatus.FAILED, errorMessage);
      const failedAt = new Date().toISOString();
      await this.eventPublisher.publish({
        type: COURSE_EVENTS.COURSE_GENERATION_FAILED,
        payload: { courseId, userId, errorMessage, failedAt },
        occurredAt: failedAt,
      });
    }
  }
}
