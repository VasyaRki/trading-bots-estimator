import { store } from '../infrastructure/cache/store.js';
import { symbols } from '../main.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const PRICE_CHANGE_THRESHOLD = 10;
const TWENTY_MIN_MS = 20 * 60 * 1000;

// const store = new Map();
const notified = new Map();

export const init = (redis) => {
  return {
    addRecord: (provider, symbol, value, timestamp = Date.now()) => {
      if (!store[provider].price.has(symbol))
        store[provider].price.set(symbol, []);
      const history = store[provider].price.get(symbol);

      history.push({ price: value, timestamp });

      while (history.length && history[0].timestamp < timestamp - ONE_HOUR_MS) {
        history.shift();
      }
    },

    estimate: () => {
      const timestamp = Date.now();

      for (const { symbol } of symbols) {
        for (const provider of ['binance', 'bybit']) {
          const history = store[provider].price.get(symbol);
          if (!history || history.length < 2) continue;

          while (
            history.length &&
            history[0].timestamp < timestamp - ONE_HOUR_MS
          ) {
            history.shift();
          }

          if (history.length < 2) continue;

          const cutoff = timestamp - TWENTY_MIN_MS;

          let oldest = null;
          for (let i = 0; i < history.length; i++) {
            if (history[i].timestamp <= cutoff) {
              oldest = history[i];
              break;
            }
          }

          if (!oldest) continue;

          const latest = history[history.length - 1];
          const percentageChange =
            ((latest.price - oldest.price) / oldest.price) * 100;

          if (Math.abs(percentageChange) > PRICE_CHANGE_THRESHOLD) {
            if (!notified.has(provider)) notified.set(provider, new Map());
            const providerNotified = notified.get(provider);

            const lastNotified = providerNotified.get(symbol);
            const canNotifyAgain =
              !lastNotified || lastNotified < timestamp - TWENTY_MIN_MS;

            if (canNotifyAgain) {
              providerNotified.set(symbol, timestamp);

              console.log(
                `[${provider}] ${symbol} - price change ${percentageChange.toFixed(
                  2,
                )}%`,
              );
              redis.publish('PUMP_EVENT', {
                symbol,
                percentageChange: percentageChange.toFixed(2),
                provider,
              });
            }
          }
        }
      }
    },
  };
};
