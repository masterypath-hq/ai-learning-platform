export interface IGoogleStateStore {
  save(state: string): Promise<void>;
  consume(state: string): Promise<boolean>;
}
