export class PriceChangeDetected {
  constructor(
    symbol,
    provider,
    percentageChange,
    signalsCountPerDay,
    timestamp = Date.now(),
  ) {
    this.symbol = symbol;
    this.provider = provider;
    this.percentageChange = percentageChange;
    this.signalsCountPerDay = signalsCountPerDay;
    this.timestamp = timestamp;
    this.eventType = 'PUMP_EVENT';
  }

  toPublishableData() {
    return {
      symbol: this.symbol,
      provider: this.provider,
      percentageChange: this.percentageChange.toFixed(2),
      signalsCountPerDay: this.signalsCountPerDay,
      timestamp: this.timestamp,
    };
  }

  equals(other) {
    return (
      other instanceof PriceChangeDetected &&
      this.symbol === other.symbol &&
      this.provider === other.provider &&
      this.timestamp === other.timestamp
    );
  }
}
