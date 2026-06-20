export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  plan_tier: string;
}

/** Reads/writes `profiles` via service role (bypasses RLS). */
export interface IProfileRepository {
  insertProfile(id: string, email: string, fullName: string): Promise<void>;
  findByUserId(id: string): Promise<ProfileRow | null>;
  ensureProfileForOAuthUser(id: string, email: string, fullName: string | null): Promise<ProfileRow>;
}
