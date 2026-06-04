export interface GithubUserInfo {
  githubId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export interface IGithubAuthProvider {
  getAuthorizationUrl(state: string): string;
  exchangeCodeForUserInfo(code: string): Promise<GithubUserInfo>;
}
