export type Track = "python" | "ai-engineering" | "forex" | "stocks";
export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type ModuleStatus = "locked" | "in-progress" | "complete";

export interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: number;
  status?: ModuleStatus;
  progress?: number;
}

export interface LearningPath {
  id: string;
  track: Track;
  title: string;
  description?: string;
  skillLevel: SkillLevel;
  progress?: number;
  modules?: Module[];
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
}

export interface Session {
  id: string;
  pathId: string;
  track: Track;
  title: string;
  modules: Module[];
  messages?: ChatMessage[];
}

export interface GenerateCurriculumPayload {
  track: Track;
  goal: string;
  skillLevel: SkillLevel;
  hoursPerWeek: number;
  targetDate?: string;
}
