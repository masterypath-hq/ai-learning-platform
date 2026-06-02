import { Subject, CourseLevel, FinanceTrack, ProgrammingTrack } from "@ai-learning-platform/shared";
import type { GenerateCourseRequest as GenerateCourseRequestDTO } from "@ai-learning-platform/shared";

const VALID_SUBJECTS = new Set(Object.values(Subject));
const VALID_LEVELS = new Set(Object.values(CourseLevel));
const VALID_TRACKS = new Set([
  ...Object.values(FinanceTrack),
  ...Object.values(ProgrammingTrack),
]);

/** Parses and validates the generate course request body. (SOLID: S.) */
export class GenerateCourseRequest {
  private constructor(public readonly dto: GenerateCourseRequestDTO) {}

  static fromBody(
    body: unknown
  ): { ok: true; request: GenerateCourseRequest } | { ok: false; error: string } {
    if (!body || typeof body !== "object") {
      return { ok: false, error: "subject, track, and level are required" };
    }
    const b = body as Record<string, unknown>;

    const subject = typeof b.subject === "string" ? b.subject : "";
    if (!VALID_SUBJECTS.has(subject as Subject)) {
      return { ok: false, error: `subject must be one of: ${[...VALID_SUBJECTS].join(", ")}` };
    }

    const track = typeof b.track === "string" ? b.track : "";
    if (!VALID_TRACKS.has(track as FinanceTrack | ProgrammingTrack)) {
      return { ok: false, error: `track must be a valid FinanceTrack or ProgrammingTrack value` };
    }

    const level = typeof b.level === "string" ? b.level : "";
    if (!VALID_LEVELS.has(level as CourseLevel)) {
      return { ok: false, error: `level must be one of: ${[...VALID_LEVELS].join(", ")}` };
    }

    const userBackground =
      typeof b.userBackground === "string" && b.userBackground.trim()
        ? b.userBackground.trim()
        : undefined;

    return {
      ok: true,
      request: new GenerateCourseRequest({
        subject: subject as Subject,
        track: track as FinanceTrack | ProgrammingTrack,
        level: level as CourseLevel,
        userBackground,
      }),
    };
  }
}
