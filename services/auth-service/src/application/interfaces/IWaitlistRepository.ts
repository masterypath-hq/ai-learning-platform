export interface IWaitlistRepository {
  /** Upsert by email — returns whether this email was already on the list. */
  add(email: string, source: string | null): Promise<{ alreadyJoined: boolean }>;
}
