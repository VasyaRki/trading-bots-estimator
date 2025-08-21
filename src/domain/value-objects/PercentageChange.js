export class PercentageChange {
  constructor(value) {
    this.value = Number(value);

    if (isNaN(this.value)) {
      throw new Error('PercentageChange must be a valid number');
    }
  }

  exceedsThreshold(threshold) {
    // return Math.abs(this.value) > Math.abs(threshold);
    return this.value >= threshold; // For now only increased oi
  }

  isPositive() {
    return this.value > 0;
  }

  isNegative() {
    return this.value < 0;
  }

  toFixed(decimals = 2) {
    return this.value.toFixed(decimals);
  }

  equals(other) {
    return other instanceof PercentageChange && this.value === other.value;
  }

  toString() {
    return `${this.value.toFixed(2)}%`;
  }
}
