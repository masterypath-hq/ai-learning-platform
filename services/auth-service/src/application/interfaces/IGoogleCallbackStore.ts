import type { GoogleSignInResponse } from "@ai-learning-platform/shared";

export interface IGoogleCallbackStore {
  save(code: string, data: GoogleSignInResponse): Promise<void>;
  consume(code: string): Promise<GoogleSignInResponse | null>;
}
