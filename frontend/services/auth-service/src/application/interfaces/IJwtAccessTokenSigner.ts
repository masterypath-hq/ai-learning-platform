/** Signs our access JWT (Gateway verifies with same secret). ISP: only signing, no Supabase. */
export interface IJwtAccessTokenSigner {
  sign(userId: string, email: string, planTier: string): string;
}
