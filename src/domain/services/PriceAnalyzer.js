import { PriceChangeDetected } from '../events/PriceChangeDetected.js';
import { PriceRecord } from '../entities/PriceRecord.js';
import { PercentageChange } from '../value-objects/PercentageChange.js';
import { Provider } from '../value-objects/Provider.js';
import { Timestamp } from '../value-objects/Timestamp.js';
import {
  findLatestRecordBeforeOrAt,
  calculatePercentageChange,
} from '../../shared/utils/index.js';

export class PriceAnalyzer {
  constructor(
    marketDataRepository,
    eventPublisher,
    config,
    signalCountRepository,
  ) {
    this.marketDataRepository = marketDataRepository;
    this.eventPublisher = eventPublisher;
    this.config = config;
    this.signalCountRepository = signalCountRepository;
    this.notificationTracker = new Map();
  }

  async addPriceRecord(provider, symbol, value, timestamp = Date.now()) {
    try {
      const record = new PriceRecord(symbol, provider, value, timestamp);
      await this.marketDataRepository.addPriceRecord(record);
    } catch (error) {
      console.error(
        `Failed to add price record for ${symbol}@${provider}:`,
        error.message,
      );
    }
  }

  async analyze() {
    const providers = Provider.VALID_PROVIDERS;
    const currentTime = new Timestamp();

    for (const provider of providers) {
      const updatedPriceHistory =
        await this.marketDataRepository.collectUpdatedPriceHistory(provider);

      for (const updatedPrice of updatedPriceHistory)
        await this.processPriceUpdate(
          updatedPrice.symbol,
          updatedPrice.history,
          provider,
          currentTime,
        );
    }
  }

  async processPriceUpdate(symbol, history, provider, currentTime) {
    const cutoffTime = currentTime.subtract(this.config.timeWindow);
    if (history.length < 2) return;
    const oldest = findLatestRecordBeforeOrAt(history, cutoffTime);
    if (!oldest) return;
    const latest = history[history.length - 1];
    const percentageChange = new PercentageChange(
      calculatePercentageChange(latest.price, oldest.price),
    );
    if (!percentageChange.exceedsThreshold(this.config.priceThreshold)) return;
    if (!this.canNotifyAgain(provider, symbol, currentTime)) return;
    await this.signalCountRepository.recordSignal(provider, symbol, 'price');
    this.recordNotification(provider, symbol, currentTime);
    const signalsCountPerDay =
      await this.signalCountRepository.getSignalsCountPerDay(
        symbol,
        provider,
        'price',
      );
    console.log({ signalsCountPerDay });
    const event = new PriceChangeDetected(
      symbol,
      provider,
      percentageChange.value,
      signalsCountPerDay || 0,
      currentTime.value,
    );

    await this.eventPublisher.publish(event);
  }

  canNotifyAgain(provider, symbol, currentTime) {
    if (!this.notificationTracker.has(provider)) return true;

    const providerTracker = this.notificationTracker.get(provider);
    const lastNotified = providerTracker.get(symbol);

    if (!lastNotified) return true;

    const cooldownEnd = new Timestamp(lastNotified).add(
      this.config.cooldownPeriod,
    );

    return currentTime.isNewerThan(cooldownEnd);
  }

  recordNotification(provider, symbol, currentTime) {
    if (!this.notificationTracker.has(provider))
      this.notificationTracker.set(provider, new Map());

    this.notificationTracker.get(provider).set(symbol, currentTime.value);
  }
}
