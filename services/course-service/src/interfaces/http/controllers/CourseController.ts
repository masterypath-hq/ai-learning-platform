import type { Request, Response } from "express";
import type { ICourseService } from "../../../application/interfaces/ICourseService.js";
import type { IMarkLessonViewedAction } from "../../../application/interfaces/IMarkLessonViewedAction.js";
import type { AuthedRequest } from "../middleware/authMiddleware.js";
import {
  CheckPlacementAnswerRequestSchema,
  CompleteOnboardingRequestSchema,
  PersistCourseContentRequestSchema,
  PersistModuleLessonsRequestSchema,
  PersistOutlineRequestSchema,
} from "@ai-learning-platform/shared";
import type { SelfAssessmentLevel } from "@ai-learning-platform/shared";

const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class CourseController {
  constructor(
    private readonly courseService: ICourseService,
    private readonly markLessonViewedAction: IMarkLessonViewedAction
  ) {}

  async listAllCourses(_req: Request, res: Response): Promise<void> {
    const result = await this.courseService.listAllCourses();
    res.status(HTTP.OK).json(result);
  }

  async listMyCourses(req: Request, res: Response): Promise<void> {
    const userId = (req as AuthedRequest).userId;
    const result = await this.courseService.listMyCourses(userId);
    res.status(HTTP.OK).json(result);
  }

  async getCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.courseService.getCourse(id);
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      throw e;
    }
  }

  async getModulesByCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.courseService.getModulesByCourseId(id);
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      throw e;
    }
  }

  async enrollInCourse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as AuthedRequest).userId;
    try {
      const result = await this.courseService.enrollCourse(id, userId);
      res.status(HTTP.CREATED).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      if (e instanceof Error && e.message === "ALREADY_ENROLLED") {
        res.status(HTTP.CONFLICT).json({ error: "Already enrolled in this course." });
        return;
      }
      throw e;
    }
  }

  async listTracks(_req: Request, res: Response): Promise<void> {
    const result = await this.courseService.listTracks();
    res.status(HTTP.OK).json(result);
  }

  async listSkills(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.courseService.listSkills(id);
      res.status(HTTP.OK).json({ skills: result });
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      throw e;
    }
  }

  async getPlacementQuestion(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { selfAssessedLevel } = req.query as { selfAssessedLevel: SelfAssessmentLevel };
    try {
      const result = await this.courseService.getPlacementQuestion(id, selfAssessedLevel);
      res.status(HTTP.OK).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      if (e instanceof Error && e.message === "QUESTION_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "No placement question found for this course and level." });
        return;
      }
      throw e;
    }
  }

  async checkPlacementAnswer(req: Request, res: Response): Promise<void> {
    const { questionId } = req.params;
    const parsed = CheckPlacementAnswerRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const correct = await this.courseService.checkPlacementAnswer(questionId, parsed.data.answer);
      res.status(HTTP.OK).json({ correct });
    } catch (e) {
      if (e instanceof Error && e.message === "QUESTION_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Question not found." });
        return;
      }
      throw e;
    }
  }

  async completeOnboarding(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = (req as AuthedRequest).userId;
    const parsed = CompleteOnboardingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ error: parsed.error.flatten() });
      return;
    }
    const { selfAssessedLevel, questionId, answer, confidenceRatings, goal } = parsed.data;
    try {
      const result = await this.courseService.completeOnboarding(
        id,
        userId,
        selfAssessedLevel,
        questionId,
        answer,
        confidenceRatings,
        goal ?? null
      );
      res.status(HTTP.CREATED).json(result);
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Course not found." });
        return;
      }
      if (e instanceof Error && e.message === "QUESTION_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ error: "Question not found." });
        return;
      }
      if (e instanceof Error && e.message === "ALREADY_ENROLLED") {
        res.status(HTTP.CONFLICT).json({ error: "Already enrolled in this course." });
        return;
      }
      throw e;
    }
  }

  async persistContent(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const parsed = PersistCourseContentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    try {
      await this.courseService.persistGeneratedContent(id, parsed.data);
      res.status(HTTP.CREATED).json({ success: true, data: null, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Course not found." });
        return;
      }
      throw e;
    }
  }

  async getLesson(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.courseService.getLessonById(id);
      res.status(HTTP.OK).json({ success: true, data: result, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "LESSON_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Lesson not found." });
        return;
      }
      throw e;
    }
  }

  async getModule(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.courseService.getModuleById(id);
      res.status(HTTP.OK).json({ success: true, data: result, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "MODULE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Module not found." });
        return;
      }
      throw e;
    }
  }

  async markLessonViewed(req: Request, res: Response): Promise<void> {
    const { courseId, lessonId } = req.params;
    const userId = (req as AuthedRequest).userId;
    try {
      await this.markLessonViewedAction.execute(userId, courseId, lessonId);
      res.status(HTTP.OK).json({ success: true, data: null, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "LESSON_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Lesson not found." });
        return;
      }
      throw e;
    }
  }

  async getGenerationStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await this.courseService.getGenerationStatus(id);
      res.status(HTTP.OK).json({ success: true, data: result, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Course not found." });
        return;
      }
      throw e;
    }
  }

  async persistGenerationOutline(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const parsed = PersistOutlineRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    try {
      const modules = await this.courseService.persistGenerationOutline(id, parsed.data);
      res.status(HTTP.CREATED).json({ success: true, data: { modules }, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Course not found." });
        return;
      }
      if (e instanceof Error && e.message === "OUTLINE_ALREADY_EXISTS") {
        res
          .status(HTTP.CONFLICT)
          .json({ success: false, data: null, error: "Outline already persisted for this course." });
        return;
      }
      throw e;
    }
  }

  async persistGenerationModuleLessons(req: Request, res: Response): Promise<void> {
    const { id, moduleId } = req.params;
    const parsed = PersistModuleLessonsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HTTP.BAD_REQUEST).json({ success: false, data: null, error: parsed.error.flatten() });
      return;
    }
    try {
      const lessons = parsed.data.lessons.map((lesson, orderIndex) => ({ ...lesson, orderIndex }));
      await this.courseService.persistGenerationModuleLessons(id, moduleId, lessons);
      res.status(HTTP.CREATED).json({ success: true, data: null, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Course not found." });
        return;
      }
      if (e instanceof Error && e.message === "MODULE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Module not found." });
        return;
      }
      if (e instanceof Error && e.message === "LESSONS_ALREADY_GENERATED") {
        res
          .status(HTTP.CONFLICT)
          .json({ success: false, data: null, error: "Lessons already persisted for this module." });
        return;
      }
      throw e;
    }
  }

  async clearGeneratedContent(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      await this.courseService.clearGeneratedContent(id);
      res.status(HTTP.OK).json({ success: true, data: null, error: null });
    } catch (e) {
      if (e instanceof Error && e.message === "COURSE_NOT_FOUND") {
        res.status(HTTP.NOT_FOUND).json({ success: false, data: null, error: "Course not found." });
        return;
      }
      throw e;
    }
  }

  async listEnrollmentsInternal(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const result = await this.courseService.listMyCourses(userId);
    res.status(HTTP.OK).json({ success: true, data: result, error: null });
  }
}
