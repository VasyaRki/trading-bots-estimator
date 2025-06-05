export const init = (redisSubscriber, redisPublisher) => {
  return {
    zadd: async (key, ttl) => {
      const currentTimestamp = Math.floor(Date.now() / 1000);

      await redisPublisher.zadd(key, currentTimestamp, `${currentTimestamp}`);

      await redisPublisher.zremrangebyscore(key, 0, currentTimestamp - ttl);
    },

    zcount: async (key, ttl) => {
      const currentTimestamp = Math.floor(Date.now() / 1000);

      const count = await redisPublisher.zcount(
        key,
        currentTimestamp - ttl,
        currentTimestamp,
      );

      return count;
    },

    publish: async (chanel, message) => {
      await redisPublisher.publish(chanel, JSON.stringify(message));
    },

    subscribe: async (chanel) => {
      await redisSubscriber.subscribe(chanel, () => {
        console.log(`Subscribe to ${chanel}`);
      });
    },

    lpushLimit: async (key, value, maxLength = 180) => {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      await redisPublisher.lpush(key, serialized);
      await redisPublisher.ltrim(key, 0, maxLength - 1);
    },

    lget: async (key) => {
      const raw = await redisPublisher.lrange(key, 0, -1);
      return raw.map((r) => JSON.parse(r));
    },

    /**
     *
     * @param {string[]} keys
     * @returns {Promise<Record<string, any[]>>}
     */
    pipelineLgetMany: async (keys) => {
      const pipeline = redisPublisher.pipeline();
      keys.forEach((key) => pipeline.lrange(key, 0, -1));

      const results = await pipeline.exec();

      const data = {};
      results.forEach(([err, res], index) => {
        const key = keys[index];
        if (err) {
          console.error(`Redis error in pipeline for key ${key}:`, err);
          data[key] = [];
        } else {
          data[key] = res.map((r) => JSON.parse(r));
        }
      });

      return data;
    },
  };
};
