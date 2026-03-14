import type { User } from "../../domain/models/User.js";

/** Port: user persistence. (SOLID: D — depend on abstraction; I — role-specific interface.) */
export interface IUserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
