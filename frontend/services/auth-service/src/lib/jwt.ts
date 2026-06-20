import type { IJwtAccessTokenSigner } from "../application/interfaces/IJwtAccessTokenSigner.js";

/** Thin factory for tests; production uses `AccessTokenSigner` from infrastructure. */
export function createSignToken(signer: IJwtAccessTokenSigner) {
  return (userId: string, email: string, plan_tier: string): string =>
    signer.sign(userId, email, plan_tier);
}
