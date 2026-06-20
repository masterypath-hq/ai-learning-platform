import type { IEventPublisher, DomainEvent } from "../../application/interfaces/IEventPublisher.js";

/**
 * In-memory publisher: logs events. Replace with RabbitMQ/Kafka adapter for production choreography.
 */
export class InMemoryEventPublisher implements IEventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    console.log("[Event]", event.type, event.payload);
  }
}
