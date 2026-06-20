export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  occurredAt: string;
}

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
