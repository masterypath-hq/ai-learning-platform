import jwt from "jsonwebtoken";
import type { IJwtAccessTokenSigner } from "../../application/interfaces/IJwtAccessTokenSigner.js";

/** Our JWT for Gateway (not Supabase's access_token). Payload matches BE-05. */
export class AccessTokenSigner implements IJwtAccessTokenSigner {
  constructor(private readonly secret: string) {}

  sign(userId: string, email: string, planTier: string): string {
    return jwt.sign(
      { sub: userId, email, plan_tier: planTier },
      this.secret,
      { expiresIn: "15m" },
    );
  }
}
