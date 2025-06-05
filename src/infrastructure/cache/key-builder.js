import { CONSTANTS } from '../../shared/constants.js';

export const RedisKeyBuilder = {
  buildCountOpenInterestSignalsKey(symbol, provider) {
    const prefix = CONSTANTS.REDIS.OPEN_INTEREST_SIGNAL_COUNT_PREFIX;
    return `${prefix}:${provider}:${symbol}`;
  },

  buildOpenInterestHistoryKey(symbol, provider) {
    const prefix = CONSTANTS.REDIS.OI_HISTORY;
    return `${prefix}:${provider}:${symbol}`;
  },

  buildPriceHistoryKey(symbol, provider) {
    const prefix = CONSTANTS.REDIS.PRICE_HISTORY;
    return `${prefix}:${provider}:${symbol}`;
  },
};
