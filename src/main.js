import pg from 'pg';
import Redis from 'ioredis';
import { config } from './shared/config.js';
import { init as redisServiceInit } from './infrastructure/cache/redis.js';
import { init as oiEstimatorInit } from './domain/oi-estimator.js';
import { init as pumpEstimatorInit } from './domain/pupm-estimator.js';
import { init as initSymbols } from './infrastructure/repositories/symbols/main.js';

const pool = new pg.Pool(config.pg);
const symbolsRepo = initSymbols(pool);

const redisPublisher = new Redis(config.redis);
const redisSubscriber = new Redis(config.redis);

const redis = redisServiceInit(redisSubscriber, redisPublisher);

const oiEstimator = oiEstimatorInit(redis);
const pumpEstimator = pumpEstimatorInit(redis);

await redis.subscribe('OI_UPDATE');
await redis.subscribe('PRICE_UPDATE');

export const symbols = await symbolsRepo.getSymbols();

redisSubscriber.on('message', (channel, message) => {
  if (channel === 'OI_UPDATE') {
    const data = JSON.parse(message);
    for (const { provider, symbol, openInterest, timestamp } of data) {
      oiEstimator.addRecord(provider, symbol, Number(openInterest), timestamp);
    }
  } else if (channel === 'PRICE_UPDATE') {
    const data = JSON.parse(message);
    for (const { provider, symbol, lastPrice, timestamp } of data) {
      pumpEstimator.addRecord(provider, symbol, Number(lastPrice), timestamp);
    }
  }
});

setInterval(() => {
  oiEstimator.estimate();
  pumpEstimator.estimate();
}, 1000);
