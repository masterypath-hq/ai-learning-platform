import type { SupabaseClient } from "@supabase/supabase-js";
import type { IProfileRepository, ProfileRow } from "../../application/interfaces/IProfileRepository.js";

export class SupabaseProfileRepository implements IProfileRepository {
  constructor(private readonly db: SupabaseClient) {}

  async insertProfile(id: string, email: string, fullName: string): Promise<void> {
    const { error } = await this.db.from("profiles").insert({
      id,
      email,
      full_name: fullName,
      plan_tier: "free",
    });
    if (error) throw new Error(`PROFILE_INSERT_FAILED:${error.message}`);
  }

  async findByUserId(id: string): Promise<ProfileRow | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("id, email, full_name, plan_tier")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`PROFILE_FETCH_FAILED:${error.message}`);
    if (!data) return null;
    return {
      id: data.id as string,
      email: data.email as string,
      full_name: (data.full_name as string | null) ?? null,
      plan_tier: (data.plan_tier as string) ?? "free",
    };
  }

  async ensureProfileForOAuthUser(
    id: string,
    email: string,
    fullName: string | null,
  ): Promise<ProfileRow> {
    const existing = await this.findByUserId(id);
    if (existing) return existing;
    const { error } = await this.db.from("profiles").insert({
      id,
      email,
      full_name: fullName,
      plan_tier: "free",
    });
    if (error) throw new Error(`PROFILE_INSERT_FAILED:${error.message}`);
    const created = await this.findByUserId(id);
    if (!created) throw new Error("PROFILE_NOT_FOUND_AFTER_INSERT");
    return created;
  }
}
