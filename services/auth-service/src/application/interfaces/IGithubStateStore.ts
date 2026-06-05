export interface IGithubStateStore {
  save(state: string): Promise<void>;
  consume(state: string): Promise<boolean>;
}
