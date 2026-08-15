export interface ICancelSubscriptionAction {
  execute(userId: string): Promise<{ message: string }>;
}
