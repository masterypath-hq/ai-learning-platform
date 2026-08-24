import { z } from "zod";

const PatchMeBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
});

/** Request object for PATCH /me. (OOP: encapsulates and validates input.) */
export class PatchMeRequest {
  private constructor(public readonly name?: string) {}

  static fromBody(body: unknown): { ok: true; request: PatchMeRequest } | { ok: false; error: string } {
    const parsed = PatchMeBodySchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" };
    }
    return { ok: true, request: new PatchMeRequest(parsed.data.name) };
  }
}
