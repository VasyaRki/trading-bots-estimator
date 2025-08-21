export class RedisSignalCountRepository {
  constructor(redisService) {
    this.redis = redisService;
  }

  async recordSignal(provider, symbol, type) {
    const key = `signals:${provider}:${symbol}:${type}`;
    const ttl = 24 * 60 * 60; // 24 години в секундах
    await this.redis.zadd(key, ttl);
  }

  async getSignalsCountPerDay(symbol, provider, type) {
    const key = `signals:${provider}:${symbol}:${type}`;
    const ttl = 24 * 60 * 60; // 24 години в секундах
    return await this.redis.zcount(key, ttl);
  }
}
