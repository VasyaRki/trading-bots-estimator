export class IEventPublisher {
  async publish(event) {
    throw new Error('Method must be implemented');
  }
}