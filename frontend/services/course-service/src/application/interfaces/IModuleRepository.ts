import type { Module } from "../../domain/models/Module.js";

/** Port: module persistence. (SOLID: D — depend on abstraction; I — role-specific interface.) */
export interface IModuleRepository {
  saveAll(modules: Module[]): Promise<void>;
  findByCourseId(courseId: string): Promise<Module[]>;
}
