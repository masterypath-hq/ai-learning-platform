/**
 * Course API contracts (v1).
 * Consumed by frontend and course service. No implementation details.
 */

// ----- Enums -----

export enum Subject {
  FINANCE = "FINANCE",
  PROGRAMMING = "PROGRAMMING",
}

export enum CourseLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  MASTERY = "MASTERY",
}

export enum CourseStatus {
  GENERATING = "GENERATING",
  READY = "READY",
  FAILED = "FAILED",
}

export enum FinanceTrack {
  FOREX_TRADING = "FOREX_TRADING",
  STOCK_MARKET = "STOCK_MARKET",
  CRYPTO_BLOCKCHAIN = "CRYPTO_BLOCKCHAIN",
  PERSONAL_FINANCE = "PERSONAL_FINANCE",
  OPTIONS_DERIVATIVES = "OPTIONS_DERIVATIVES",
}

export enum ProgrammingTrack {
  PYTHON = "PYTHON",
  WEB_DEVELOPMENT = "WEB_DEVELOPMENT",
  AI_MACHINE_LEARNING = "AI_MACHINE_LEARNING",
  AI_ENGINEERING = "AI_ENGINEERING",
  CYBERSECURITY = "CYBERSECURITY",
  DATA_STRUCTURES_ALGORITHMS = "DATA_STRUCTURES_ALGORITHMS",
}

export type CourseTrack = FinanceTrack | ProgrammingTrack;

// ----- Request DTOs -----

export interface GenerateCourseRequest {
  subject: Subject;
  track: CourseTrack;
  level: CourseLevel;
  userBackground?: string;
}

// ----- Response DTOs -----

export interface GenerateCourseResponse {
  courseId: string;
  status: CourseStatus;
}

export interface CourseStatusResponse {
  courseId: string;
  status: CourseStatus;
  title?: string;
  errorMessage?: string;
}

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
  position: number;
  title: string;
  explanationContent: string;
  keyTakeaways: string[];
  estimatedDurationMinutes: number;
  workedExamples: WorkedExampleResponse[];
  practiceExercise: PracticeExerciseResponse | null;
}

export interface ModuleResponse {
  id: string;
  position: number;
  theme: string;
  keyConcepts: string[];
  estimatedDurationMinutes: number;
  lessons: LessonResponse[];
}

export interface CourseResponse {
  id: string;
  userId: string;
  subject: Subject;
  track: CourseTrack;
  level: CourseLevel;
  title: string;
  description: string;
  learningObjectives: string[];
  prerequisites: string[];
  estimatedDurationMinutes: number;
  status: CourseStatus;
  modules: ModuleResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseListItem {
  id: string;
  subject: Subject;
  track: CourseTrack;
  level: CourseLevel;
  title: string;
  description: string;
  estimatedDurationMinutes: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListCoursesResponse {
  courses: CourseListItem[];
  total: number;
  page: number;
  limit: number;
}

// ----- Domain events (for choreography) -----

export const COURSE_EVENTS = {
  COURSE_GENERATION_STARTED: "course.generation.started.v1",
  COURSE_READY: "course.ready.v1",
  COURSE_GENERATION_FAILED: "course.generation.failed.v1",
} as const;

export interface CourseGenerationStartedPayload {
  courseId: string;
  userId: string;
  subject: Subject;
  track: CourseTrack;
  level: CourseLevel;
  startedAt: string;
}

export interface CourseReadyPayload {
  courseId: string;
  userId: string;
  title: string;
  readyAt: string;
}

export interface CourseGenerationFailedPayload {
  courseId: string;
  userId: string;
  errorMessage: string;
  failedAt: string;
}
