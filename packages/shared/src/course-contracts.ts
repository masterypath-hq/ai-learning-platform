/**
 * Course API contracts (v1).
 * Consumed by frontend and course service. No implementation details.
 */

// ----- Domain types -----

export type PhaseLevel = "foundation" | "intermediate" | "advanced" | "mastery";

export type EnrollmentStatus = "active" | "paused" | "completed" | "dropped";

export type TrackSlug =
  | "backend"
  | "frontend"
  | "fullstack"
  | "ai-engineering"
  | "data-analysis"
  | "cybersecurity"
  | "stock-trading"
  | "forex-trading"
  | "personal-finance"
  | "crypto-defi"
  | (string & {});


export interface WorkedExampleResponse {
  id: string;
  position: number;
  title: string;
  content: string;
  solution: string;
}

export interface PracticeExerciseResponse {
  id: string;
  title: string;
  prompt: string;
  hints: string[];
  sampleSolution: string;
}

export interface LessonResponse {
  id: string;
  slug: string;
  title: string;
  contentUrl: string | null;
  contentType: string;
  durationMins: number | null;
  orderIndex: number;
  isPublished: boolean;
  isProject: boolean;
  workedExamples: WorkedExampleResponse[];
  practiceExercise: PracticeExerciseResponse | null;
}

export interface ModuleResponse {
  id: string;
  phase: PhaseLevel;
  title: string;
  description: string | null;
  orderIndex: number;
  durationWeeks: number | null;
  isPublished: boolean;
  lessons: LessonResponse[];
}

export interface CourseResponse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  primaryLanguage: string | null;
  thumbnailUrl: string | null;
  durationWeeks: number | null;
  isPublished: boolean;
  modules: ModuleResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface TrackCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  primaryLanguage: string | null;
  thumbnailUrl: string | null;
  durationWeeks: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListTrackCoursesResponse {
  courses: TrackCourse[];
  total: number;
}

export interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  description: string | null;
  primaryLanguage: string | null;
  thumbnailUrl: string | null;
  durationWeeks: number | null;
  status: EnrollmentStatus;
  currentPhase: PhaseLevel;
  enrolledAt: string;
  completedAt: string | null;
}

export interface ListEnrolledCoursesResponse {
  courses: EnrolledCourse[];
  total: number;
}

export interface ModuleListItem {
  id: string;
  phase: PhaseLevel;
  title: string;
  description: string | null;
  orderIndex: number;
  durationWeeks: number | null;
  isPublished: boolean;
}

export interface CourseWithModules extends Omit<CourseResponse, "modules"> {
  modules: ModuleListItem[];
}

export interface ListModulesResponse {
  course: CourseWithModules;
  total: number;
}

export interface TrackCategoryResponse {
  category: string;
  courses: TrackCourse[];
}

export interface ListTracksResponse {
  tracks: TrackCategoryResponse[];
}
