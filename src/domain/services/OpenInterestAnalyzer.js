import { OpenInterestThresholdExceeded } from '../events/OpenInterestThresholdExceeded.js';
import { OpenInterestRecord } from '../entities/OpenInterestRecord.js';
import { PercentageChange } from '../value-objects/PercentageChange.js';
import { Provider } from '../value-objects/Provider.js';
import { Timestamp } from '../value-objects/Timestamp.js';
import {
  findLatestRecordBeforeOrAt,
  calculatePercentageChange,
} from '../../shared/utils/index.js';

export class OpenInterestAnalyzer {
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

  async addOpenInterestRecord(provider, symbol, value, timestamp = Date.now()) {
    try {
      const record = new OpenInterestRecord(symbol, provider, value, timestamp);
      await this.marketDataRepository.addOpenInterestRecord(record);
    } catch (error) {
      console.error(
        `Failed to add OI record for ${symbol}@${provider}:`,
        error.message,
      );
    }
  }

  async analyze() {
    const providers = Provider.VALID_PROVIDERS;
    const currentTime = new Timestamp();

    for (const provider of providers) {
      const updatedOpenInteresHistory =
        await this.marketDataRepository.collectUpdatedOpenInterestHistory(
          provider,
        );

      for (const updatedOpenInteres of updatedOpenInteresHistory)
        await this.processOpenInterestUpdate(
          updatedOpenInteres.symbol,
          updatedOpenInteres.history,
          provider,
          currentTime,
        );
    }
  }

  async processOpenInterestUpdate(symbol, history, provider, currentTime) {
    const cutoffTime = currentTime.subtract(this.config.timeWindow);
    if (!this.canNotifyAgain(provider, symbol, currentTime)) return;
    if (history.length < 2) return;
    const oldest = findLatestRecordBeforeOrAt(history, cutoffTime);
    if (!oldest) return;
    const latest = history[history.length - 1];
    const percentageChange = new PercentageChange(
      calculatePercentageChange(latest.oi, oldest.oi),
    );
    const pricePercentageChange = await this.calculatePricePercentageChange(
      symbol,
      provider,
      cutoffTime,
    );
    if (!percentageChange.exceedsThreshold(this.config.oiThreshold)) return;
    const signalsCountPerDay =
      await this.signalCountRepository.getSignalsCountPerDay(
        symbol,
        provider,
        'oi',
      );
    if (
      signalsCountPerDay &&
      signalsCountPerDay > this.config.limitOiSignalsPerDay
    )
      return;
    const event = new OpenInterestThresholdExceeded(
      symbol,
      provider,
      percentageChange.value,
      pricePercentageChange,
      signalsCountPerDay || 0,
      currentTime.value,
    );
    await this.signalCountRepository.recordSignal(provider, symbol, 'oi');
    this.recordNotification(provider, symbol, currentTime);
    await this.eventPublisher.publish(event);
  }

  async calculatePricePercentageChange(symbol, provider, cutoffTime) {
    const oldestLatestPrice =
      await this.marketDataRepository.getOldestLatestPrice(
        symbol,
        provider,
        cutoffTime,
      );

    if (!oldestLatestPrice) return 0;
    const { latest, oldest } = oldestLatestPrice;

    return new PercentageChange(
      calculatePercentageChange(latest.price, oldest.price),
    );
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
