export class AnalysisConfig {
  constructor({
    oiThreshold = 3,
    priceThreshold = 10,
    limitOiSignalsPerDay = 5,
    timeWindow = 20 * 60 * 1000,
    cooldownPeriod = 20 * 60 * 1000,
    dataRetentionPeriod = 60 * 60 * 1000,
  } = {}) {
    this.oiThreshold = Number(oiThreshold);
    this.priceThreshold = Number(priceThreshold);
    this.timeWindow = Number(timeWindow);
    this.cooldownPeriod = Number(cooldownPeriod);
    this.dataRetentionPeriod = Number(dataRetentionPeriod);
    this.limitOiSignalsPerDay = Number(limitOiSignalsPerDay);

    this.validate();
  }

  validate() {
    if (this.oiThreshold <= 0) {
      throw new Error('OI threshold must be positive');
    }

    if (this.priceThreshold <= 0) {
      throw new Error('Price threshold must be positive');
    }

    if (this.timeWindow <= 0) {
      throw new Error('Time window must be positive');
    }

    if (this.cooldownPeriod <= 0) {
      throw new Error('Cooldown period must be positive');
    }

    if (this.dataRetentionPeriod <= 0) {
      throw new Error('Data retention period must be positive');
    }
  }

  equals(other) {
    return (
      other instanceof AnalysisConfig &&
      this.oiThreshold === other.oiThreshold &&
      this.priceThreshold === other.priceThreshold &&
      this.timeWindow === other.timeWindow &&
      this.cooldownPeriod === other.cooldownPeriod &&
      this.dataRetentionPeriod === other.dataRetentionPeriod
    );
  }
}
