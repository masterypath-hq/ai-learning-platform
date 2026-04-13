export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

/** Port: Google OAuth token exchange and user info retrieval. */
export interface IGoogleAuthProvider {
  getAuthorizationUrl(state: string): string;
  exchangeCodeForUserInfo(code: string): Promise<GoogleUserInfo>;
}
