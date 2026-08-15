import type { Module } from "../../domain/models/Module.js";

export interface IModuleRepository {
  findByCourseId(courseId: string): Promise<Module[]>;
  findById(id: string): Promise<Module | null>;
}
