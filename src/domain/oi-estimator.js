import { store } from '../infrastructure/cache/store.js';
import { symbols } from '../main.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_MIN_MS = 20 * 60 * 1000;
const OI_CHANGE_THRESHOLD = 3;

const notified = new Map();

export const init = (redis) => {
  const calculatePricePercentageChange = (provider, symbol, cutoff) => {
    let oldest = null;
    const history = store[provider].price.get(symbol);
    if (!history) return null;
    for (let i = 0; i < history.length; i++) {
      if (history[i].timestamp <= cutoff) {
        oldest = history[i];
        break;
      }
    }
    if (!oldest) return null;
    const latest = history[history.length - 1];
    const percentageChange =
      ((latest.price - oldest.price) / oldest.price) * 100;

    return percentageChange;
  };

  return {
    addRecord: (provider, symbol, value, timestamp = Date.now()) => {
      const oiMap = store[provider].oi;

      if (!oiMap.has(symbol)) oiMap.set(symbol, []);

      const history = oiMap.get(symbol);
      history.push({ oi: value, timestamp });

      while (history.length && history[0].timestamp < timestamp - ONE_HOUR_MS) {
        history.shift();
      }
    },

    estimate: async () => {
      const timestamp = Date.now();

      for (const { symbol } of symbols) {
        for (const provider of ['binance', 'bybit']) {
          const history = store[provider].oi.get(symbol);
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
          const oiPercentageChange =
            ((latest.oi - oldest.oi) / oldest.oi) * 100;

          if (Math.abs(oiPercentageChange) > OI_CHANGE_THRESHOLD) {
            if (!notified.has(provider)) notified.set(provider, new Map());
            const providerNotified = notified.get(provider);

            const lastNotified = providerNotified.get(symbol);
            const canNotifyAgain =
              !lastNotified || lastNotified < timestamp - TWENTY_MIN_MS;

            if (canNotifyAgain) {
              providerNotified.set(symbol, timestamp);

              const pricePercentageChange = calculatePricePercentageChange(
                provider,
                symbol,
                cutoff,
              );

              redis.publish('OI_EVENT', {
                symbol,
                provider,
                signalsCountPerDay: 1,
                openClosePercentageDifference: pricePercentageChange.toFixed(2),
                openInterestPercentageDifference: oiPercentageChange.toFixed(2),
              });
            }
          }
        }
      }
    },
  };
};
