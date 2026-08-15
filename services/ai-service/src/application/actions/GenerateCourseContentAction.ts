import type {
  GenerateCourseContentRequest,
  PersistCourseContentRequest,
  PersistModule,
  PhaseLevel,
} from "@ai-learning-platform/shared";
import type { ICourseContentGenerator } from "../interfaces/ICourseContentGenerator.js";
import type { IGenerateCourseContentAction } from "../interfaces/IGenerateCourseContentAction.js";

const PHASE_ORDER: Record<PhaseLevel, number> = {
  foundation: 0,
  intermediate: 1,
  advanced: 2,
  mastery: 3,
};

/**
 * Generates the full module → lesson tree for one catalog course. Modules are
 * generated as a single outline call, then lessons are generated per module,
 * sequentially (one Claude call per module keeps each call's output within a
 * reliable token budget instead of asking for the whole course in one shot).
 */
export class GenerateCourseContentAction implements IGenerateCourseContentAction {
  constructor(private readonly generator: ICourseContentGenerator) {}

  async execute(request: GenerateCourseContentRequest): Promise<PersistCourseContentRequest> {
    const outline = await this.generator.generateCourseOutline(request.trackSlug, request.title, request.description);

    const orderedModules = [...outline.modules].sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]);

    const modules: PersistModule[] = [];
    for (const [moduleIndex, moduleOutline] of orderedModules.entries()) {
      const { lessons } = await this.generator.generateModuleLessons(request.trackSlug, moduleOutline);

      modules.push({
        ...moduleOutline,
        orderIndex: moduleIndex,
        lessons: lessons.map((lesson, lessonIndex) => ({ ...lesson, orderIndex: lessonIndex })),
      });
    }

    return {
      learningObjectives: outline.learningObjectives,
      prerequisites: outline.prerequisites,
      modules,
    };
  }
}
