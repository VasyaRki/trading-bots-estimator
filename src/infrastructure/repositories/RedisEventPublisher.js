import { IEventPublisher } from '../../domain/repositories/IEventPublisher.js';

export class RedisEventPublisher extends IEventPublisher {
  constructor(redisService) {
    super();
    this.redis = redisService;
  }

  async publish(event) {
    if (!event || !event.eventType) {
      throw new Error('Event must have an eventType');
    }

    const data = event.toPublishableData ? event.toPublishableData() : event;
    await this.redis.publish(event.eventType, data);
  }
}
