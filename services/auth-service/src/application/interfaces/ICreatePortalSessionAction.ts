export interface ICreatePortalSessionAction {
  execute(userId: string): Promise<{ url: string }>;
}
