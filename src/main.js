import pg from 'pg';
import Redis from 'ioredis';
import { config } from './shared/config.js';
import { init as redisServiceInit } from './infrastructure/cache/redis.js';

// Import new DDD components
import { InMemoryMarketDataRepository } from './infrastructure/repositories/InMemoryMarketDataRepository.js';
import { RedisEventPublisher } from './infrastructure/repositories/RedisEventPublisher.js';
import { RedisSignalCountRepository } from './infrastructure/repositories/RedisSignalCountRepository.js';
import { OpenInterestAnalyzer } from './domain/services/OpenInterestAnalyzer.js';
import { PriceAnalyzer } from './domain/services/PriceAnalyzer.js';
import { AnalysisConfig } from './domain/value-objects/AnalysisConfig.js';

// Initialize infrastructure
const redisPublisher = new Redis(config.redis);
const redisSubscriber = new Redis(config.redis);

const redis = redisServiceInit(redisSubscriber, redisPublisher);

// Initialize repositories and services
const marketDataRepository = new InMemoryMarketDataRepository();
const eventPublisher = new RedisEventPublisher(redis);
const signalCountRepository = new RedisSignalCountRepository(redis);
const analysisConfig = new AnalysisConfig();

// Initialize domain services
const oiAnalyzer = new OpenInterestAnalyzer(
  marketDataRepository,
  eventPublisher,
  analysisConfig,
  signalCountRepository,
);
const priceAnalyzer = new PriceAnalyzer(
  marketDataRepository,
  eventPublisher,
  analysisConfig,
  signalCountRepository,
);

await redis.subscribe('OI_UPDATE');
await redis.subscribe('PRICE_UPDATE');

redisSubscriber.on('message', async (channel, message) => {
  try {
    if (channel === 'OI_UPDATE') {
      const messages = JSON.parse(message);
      const dataArray = Array.isArray(messages) ? messages : [messages];
      console.log(`[OI_UPDATE] Handled ${dataArray.length} oi updates`);
      for (const msg of dataArray) {
        const { data } = msg;
        if (
          data &&
          data.symbol &&
          data.provider &&
          data.value !== undefined &&
          data.timestamp
        ) {
          await oiAnalyzer.addOpenInterestRecord(
            data.provider,
            data.symbol,
            Number(data.value),
            data.timestamp,
          );
        }
      }
    } else if (channel === 'PRICE_UPDATE') {
      const messages = JSON.parse(message);
      const dataArray = Array.isArray(messages) ? messages : [messages];
      console.log(`[PRICE_UPDATE] Handled ${dataArray.length} price updates`);
      for (const msg of dataArray) {
        const { data } = msg;
        if (
          data &&
          data.symbol &&
          data.provider &&
          data.value !== undefined &&
          data.timestamp
        ) {
          await priceAnalyzer.addPriceRecord(
            data.provider,
            data.symbol,
            Number(data.value),
            data.timestamp,
          );
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ${channel} message:`, error.message);
  }
});

setInterval(async () => {
  try {
    await oiAnalyzer.analyze();
    await priceAnalyzer.analyze();
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}, 1000);
