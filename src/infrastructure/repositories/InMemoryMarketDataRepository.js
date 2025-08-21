import { IMarketDataRepository } from '../../domain/repositories/IMarketDataRepository.js';
import { PriceRecord } from '../../domain/entities/PriceRecord.js';
import { OpenInterestRecord } from '../../domain/entities/OpenInterestRecord.js';
import { Provider } from '../../domain/value-objects/Provider.js';
import { findLatestRecordBeforeOrAt } from '../../shared/utils/index.js';
export class InMemoryMarketDataRepository extends IMarketDataRepository {
  constructor() {
    super();
    this.store = {
      binance: {
        price: new Map(),
        oi: new Map(),
      },
      bybit: {
        price: new Map(),
        oi: new Map(),
      },
    };
  }

  async addPriceRecord(priceRecord) {
    if (!(priceRecord instanceof PriceRecord)) {
      throw new Error('Expected PriceRecord instance');
    }

    new Provider(priceRecord.provider);

    const providerStore = this.store[priceRecord.provider];

    if (!providerStore.price.has(priceRecord.symbol)) {
      providerStore.price.set(priceRecord.symbol, {
        history: [],
        updated: true,
      });
    }

    const priceSymbolDataStore = providerStore.price.get(priceRecord.symbol);

    priceSymbolDataStore.history.push({
      price: priceRecord.price,
      timestamp: priceRecord.timestamp,
    });
    priceSymbolDataStore.updated = true;

    const cutoff = priceRecord.timestamp - 60 * 60 * 1000;

    while (
      priceSymbolDataStore.history.length &&
      priceSymbolDataStore.history[0].timestamp < cutoff
    ) {
      priceSymbolDataStore.history.shift();
    }
  }

  async addOpenInterestRecord(oiRecord) {
    if (!(oiRecord instanceof OpenInterestRecord)) {
      throw new Error('Expected OpenInterestRecord instance');
    }

    new Provider(oiRecord.provider);

    const providerStore = this.store[oiRecord.provider];
    if (!providerStore.oi.has(oiRecord.symbol)) {
      providerStore.oi.set(oiRecord.symbol, { history: [], updated: true });
    }

    const oiSymbolDataStore = providerStore.oi.get(oiRecord.symbol);
    oiSymbolDataStore.history.push({
      oi: oiRecord.openInterest,
      timestamp: oiRecord.timestamp,
    });
    oiSymbolDataStore.updated = true;

    const cutoff = oiRecord.timestamp - 60 * 60 * 1000;

    while (
      oiSymbolDataStore.history.length &&
      oiSymbolDataStore.history[0].timestamp < cutoff
    ) {
      oiSymbolDataStore.history.shift();
    }
  }

  async collectUpdatedOpenInterestHistory(provider) {
    const oiStore = this.store[provider].oi;

    const updated = [];
    for (const [symbol, data] of oiStore.entries()) {
      if (!data.updated) continue;

      updated.push({ symbol, history: data.history });
      data.updated = false;
    }

    return updated;
  }

  async collectUpdatedPriceHistory(provider) {
    const priceStore = this.store[provider].price;

    const updated = [];
    for (const [symbol, data] of priceStore.entries()) {
      if (!data.updated) continue;

      updated.push({ symbol, history: data.history });
      data.updated = false;
    }

    return updated;
  }

  async getOldestLatestPrice(symbol, provider, time) {
    const priceData = this.store[provider].price.get(symbol);
    if (priceData.history.length < 2) return null;
    const oldest = findLatestRecordBeforeOrAt(priceData.history, time);
    if (!oldest) return null;

    return {
      oldest: oldest,
      latest: priceData.history[priceData.history.length - 1],
    };
  }

  async cleanupOldData(cutoffTimestamp) {
    for (const provider of Provider.VALID_PROVIDERS) {
      const providerStore = this.store[provider];

      for (const [symbol, history] of providerStore.price.entries()) {
        while (history.length && history[0].timestamp < cutoffTimestamp) {
          history.shift();
        }
      }

      for (const [symbol, history] of providerStore.oi.entries()) {
        while (history.length && history[0].timestamp < cutoffTimestamp) {
          history.shift();
        }
      }
    }
  }
}
