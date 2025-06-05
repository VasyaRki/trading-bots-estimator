import 'dotenv/config';
import { requireEnv } from './utils/env.js';

export const config = {
  pg: {
    host: requireEnv('PG_HOST'),
    port: parseInt(requireEnv('PG_PORT')),
    user: requireEnv('PG_USER'),
    database: requireEnv('PG_DATABASE'),
    password: requireEnv('PG_PASSWORD'),
    ssl: {
      rejectUnauthorized: true,
      ca: requireEnv('PG_SSL_PRIVATE_KEY').replace(/\\n/g, '\n'),
    },
  },
  redis: {
    host: requireEnv('REDIS_HOST'),
    port: requireEnv('REDIS_PORT'),
    password: requireEnv('REDIS_PASSWORD'),
    db: requireEnv('REDIS_DB'),
  },
  binance: {
    furl: 'https://fapi.binance.com',
    limits: [
      {
        key: 'BNC: RPM',
        time: 1000 * 60,
        rate: parseInt(process.env.BNC_REQUESTS_PER_MINUTE || '1000'),
      },
    ],
  },
  bybit: {
    url: 'https://api.bybit.com',
    limits: [
      {
        key: 'BBT: RPM',
        time: 1000,
        rate: parseInt(process.env.BNC_REQUESTS_PER_MINUTE || '1000'),
      },
    ],
  },
};
