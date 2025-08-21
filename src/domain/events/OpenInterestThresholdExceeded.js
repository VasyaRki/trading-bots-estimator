export class OpenInterestThresholdExceeded {
  constructor(
    symbol,
    provider,
    oiPercentageChange,
    pricePercentageChange,
    signalsCountPerDay,
    timestamp = Date.now(),
  ) {
    this.symbol = symbol;
    this.provider = provider;
    this.oiPercentageChange = oiPercentageChange;
    this.pricePercentageChange = pricePercentageChange;
    this.signalsCountPerDay = signalsCountPerDay;
    this.timestamp = timestamp;
    this.eventType = 'OI_EVENT';
  }

  toPublishableData() {
    return {
      symbol: this.symbol,
      provider: this.provider,
      signalsCountPerDay: this.signalsCountPerDay,
      openClosePercentageDifference:
        this.pricePercentageChange?.toFixed(2) || '0.00',
      openInterestPercentageDifference: this.oiPercentageChange.toFixed(2),
      timestamp: this.timestamp,
    };
  }

  equals(other) {
    return (
      other instanceof OpenInterestThresholdExceeded &&
      this.symbol === other.symbol &&
      this.provider === other.provider &&
      this.timestamp === other.timestamp
    );
  }
}
